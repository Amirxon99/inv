const pool = require("../../config/db");
const Joi = require("joi");
const { v4: uuidv4 } = require("uuid");

// 🔹 Validation schema
const assetSchema = Joi.object({
  name: Joi.string().required(),
  inv_number: Joi.string().required(),
  status: Joi.string()
    .valid("new", "active", "inactive", "repair", "written_off", "not_found")
    .default("new"),
  type: Joi.string().valid("permanent", "temporary").default("permanent"),
  room_id: Joi.number().allow(null),
  price: Joi.number().precision(2).allow(null),
  department_id: Joi.number().allow(null),
  category_id: Joi.number().allow(null),
  quantity: Joi.number().integer().min(1).default(1),
  notes: Joi.string().allow(null),
});

// 🔹 CREATE ASSET (QR bilan)
const createAsset = async (req, res) => {
  try {
    const { role } = req.user;
    if (!["super_admin", "admin"].includes(role))
      return res.status(403).json({ message: "Forbidden" });

    const { error, value } = assetSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { name, inv_number, status, type, room_id, price, department_id, category_id, quantity } = value;

    const createdAssets = [];

    for (let i = 0; i < quantity; i++) {
      const currentInvNumber = quantity > 1 ? `${Number(inv_number) + i}` : inv_number;

      const existing = await pool.query("SELECT id FROM assets WHERE inv_number=$1", [currentInvNumber]);
      if (existing.rows.length) continue;

      const qrToken = uuidv4();

      const result = await pool.query(
        `INSERT INTO assets
        (name, inv_number, qr_token, status, type, room_id, price, department_id, category_id, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
        RETURNING *`,
        [name, currentInvNumber, qrToken, status, type, room_id, price, department_id, category_id]
      );

      createdAssets.push(result.rows[0]);
    }

    if (!createdAssets.length)
      return res.status(400).json({ message: "Assetlar yaratilmadi (barchasi mavjud edi)" });

    res.status(201).json({ message: "Assetlar yaratildi", assets: createdAssets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 GET ASSET BY QR TOKEN
const getAssetByQrToken = async (req, res) => {
  try {
    const { qr_token } = req.params;

    // 1. Jihoz ma'lumotlarini olish
    const assetRes = await pool.query(
      `SELECT a.*, r.name AS room_name, r.campus, d.name AS department_name, c.name AS category_name
       FROM assets a
       LEFT JOIN rooms r ON a.room_id = r.id
       LEFT JOIN departments d ON a.department_id = d.id
       LEFT JOIN asset_categories c ON a.category_id = c.id
       WHERE a.qr_token=$1`,
      [qr_token]
    );

    if (!assetRes.rows.length) {
      return res.status(404).json({ message: "Jihoz topilmadi" });
    }

    const assetData = assetRes.rows[0];

    // 2. Agar so'rov yuborgan odam login qilgan bo'lsa, ro'yxatlarni ham qo'shib yuboramiz
    // Buning uchun req.user (authMiddleware'dan keladi) ni tekshirish mumkin, 
    // lekin routerda authMiddleware'ni olib tashlaganimiz uchun, 
    // biz shunchaki ixtiyoriy ravishda jo'natishimiz yoki frontendda tekshirishimiz mumkin.
    
    // Eng xavfsiz va toza yo'li: hamma listlarni hamisha yuborish (agar hajmi kichik bo'lsa)
    // yoki faqat kerak bo'lganda yuborish.
    
    const roomsList = await pool.query(`SELECT id, name, campus, department_id FROM rooms ORDER BY name ASC`);
    const departmentsList = await pool.query(`SELECT id, name FROM departments ORDER BY name ASC`);

    res.json({
      asset: assetData,
      roomsList: roomsList.rows,
      departmentsList: departmentsList.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server xatosi" });
  }
};

// 🔹 GET ASSETS
const getAssets = async (req, res) => {
  try {
    let { page = 0, size = 10, sort = "id,asc", q = "", room_id, department_id, campus, category_id } = req.query;
    page = parseInt(page);
    size = parseInt(size);

    let [sortField, sortOrder] = sort.split(",");
    const validFields = ["id","name","inv_number","status","type","price","room_name","department_name","category_name","campus","created_at"];
    if (!validFields.includes(sortField)) sortField = "id";
    sortOrder = sortOrder?.toLowerCase() === "desc" ? "DESC" : "ASC";

    const offset = page * size;
    const filters = [];
    const values = [];
    let idx = 1;

    if (q) { filters.push(`(a.name ILIKE $${idx} OR a.inv_number ILIKE $${idx})`); values.push(`%${q}%`); idx++; }
    if (room_id) { filters.push(`a.room_id=$${idx}`); values.push(room_id); idx++; }
    if (department_id) { filters.push(`a.department_id=$${idx}`); values.push(department_id); idx++; }
    if (campus) { filters.push(`r.campus=$${idx}`); values.push(campus); idx++; }
    if (category_id) { filters.push(`a.category_id=$${idx}`); values.push(category_id); idx++; }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const totalResult = await pool.query(
      `SELECT COUNT(*) FROM assets a
       LEFT JOIN rooms r ON a.room_id = r.id
       LEFT JOIN departments d ON a.department_id = d.id
       LEFT JOIN asset_categories c ON a.category_id = c.id
       ${whereClause}`,
      values
    );
    const total = parseInt(totalResult.rows[0].count);

    let orderClause = `a.${sortField} ${sortOrder}`;
    if (sortField === "room_name") orderClause = `r.name ${sortOrder}`;
    if (sortField === "department_name") orderClause = `d.name ${sortOrder}`;
    if (sortField === "category_name") orderClause = `c.name ${sortOrder}`;

    const assetsResult = await pool.query(
      `SELECT a.*, r.name AS room_name, r.campus, d.name AS department_name, c.name AS category_name
       FROM assets a
       LEFT JOIN rooms r ON a.room_id = r.id
       LEFT JOIN departments d ON a.department_id = d.id
       LEFT JOIN asset_categories c ON a.category_id = c.id
       ${whereClause}
       ORDER BY ${orderClause} LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, size, offset]
    );

    const roomsListRes = await pool.query(`SELECT id, name, campus, department_id FROM rooms ORDER BY name ASC`);
    const departmentsListRes = await pool.query(`SELECT id, name FROM departments ORDER BY name ASC`);
    const categoriesListRes = await pool.query(`SELECT id, name FROM asset_categories ORDER BY name ASC`);

    res.status(200).json({
      page, size, total, totalPages: Math.ceil(total / size),
      content: assetsResult.rows,
      roomsList: roomsListRes.rows,
      departmentsList: departmentsListRes.rows,
      categoriesList: categoriesListRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 GET BY ID
const getAssetById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT a.*, r.name AS room_name, r.campus, d.name AS department_name, c.name AS category_name
       FROM assets a
       LEFT JOIN rooms r ON a.room_id = r.id
       LEFT JOIN departments d ON a.department_id = d.id
       LEFT JOIN asset_categories c ON a.category_id = c.id
       WHERE a.id=$1`,
      [id]
    );

    if (!result.rows.length) return res.status(404).json({ message: "Asset not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 DELETE ASSET
const deleteAsset = async (req, res) => {
  try {
    const { role } = req.user;
    if (!["super_admin", "admin"].includes(role))
      return res.status(403).json({ message: "Forbidden" });

    const { id } = req.params;
    const result = await pool.query(`DELETE FROM assets WHERE id=$1 RETURNING *`, [id]);

    if (!result.rows.length) return res.status(404).json({ message: "Asset not found" });
    res.json({ message: "Asset deleted", asset: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 UNIVERSAL UPDATE ASSET (id yoki qr_token bilan, movement yozadi)
const updateAssetUniversal = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id, qr_token } = req.params;
    const { status, department_id, room_id, notes, category_id, name, inv_number, type, price } = req.body;
    const movedBy = req.user.id;

    if (!id && !qr_token) {
      return res.status(400).json({ message: "id yoki qr_token kerak" });
    }

    await client.query("BEGIN");

    // 🔹 assetni topish
    let assetRes;
    if (id) {
      assetRes = await client.query(`SELECT id, room_id FROM assets WHERE id = $1`, [id]);
    } else {
      assetRes = await client.query(`SELECT id, room_id FROM assets WHERE qr_token = $1`, [qr_token]);
    }

    if (!assetRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Asset topilmadi" });
    }

    const asset = assetRes.rows[0];
    const oldRoom = asset.room_id;

    // 🔹 movement yozish (agar room o‘zgarsa)
    if (oldRoom !== room_id) {
      await client.query(
        `INSERT INTO asset_movements
         (asset_id, from_room_id, to_room_id, moved_by, moved_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [asset.id, oldRoom, room_id, movedBy, notes || null]
      );
    }

    // 🔹 assetni update qilish
    const result = await client.query(
      `UPDATE assets
       SET name = COALESCE($1, name),
           inv_number = COALESCE($2, inv_number),
           status = COALESCE($3, status),
           type = COALESCE($4, type),
           room_id = COALESCE($5, room_id),
           price = COALESCE($6, price),
           department_id = COALESCE($7, department_id),
           category_id = COALESCE($8, category_id),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name, inv_number, status, type, room_id, price, department_id, category_id, asset.id]
    );

    await client.query("COMMIT");

    res.json({ message: "Asset muvaffaqiyatli yangilandi", asset: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Server xatoligi" });
  } finally {
    client.release();
  }
};
module.exports = {
  createAsset,
  getAssets,
  getAssetById,
  deleteAsset,
  getAssetByQrToken,
  updateAssetUniversal, // endi yagona update endpoint
};