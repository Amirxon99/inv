const pool = require("../../config/db");
const Joi = require("joi");

// ================= VALIDATION =================

const roomSchema = Joi.object({
  name: Joi.string().required(),
  floor: Joi.number().required(),
  type: Joi.string().valid("hall", "room", "other", "store").default("room"),
  campus: Joi.string().valid("campus1", "campus2").default("campus1"),
  department_id: Joi.number().allow(null) // bo‘lim id optional
});

// ================= CREATE =================

const createRoom = async (req, res) => {
  try {
    const { role } = req.user;
    if (!["super_admin", "admin"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    let { name, floor, type, campus, department_id } = req.body;

    // 🔹 Bo'sh string bo'lsa null ga aylantirish
    if (department_id === "") department_id = null;

    const { error, value } = roomSchema.validate({ name, floor, type, campus, department_id });
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { name: validatedName, floor: validatedFloor, type: validatedType, campus: validatedCampus, department_id: validatedDeptId } = value;

    const result = await pool.query(
      `INSERT INTO rooms (name, floor, type, campus, department_id)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [validatedName, validatedFloor, validatedType, validatedCampus, validatedDeptId]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateRoom = async (req, res) => {
  try {
    const { role } = req.user;
    if (!["super_admin", "admin"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { id } = req.params;
    let { name, floor, type, campus, department_id } = req.body;

    // 🔹 Bo'sh string bo'lsa null ga aylantirish
    if (department_id === "") department_id = null;

    const { error, value } = roomSchema.validate({ name, floor, type, campus, department_id });
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { name: validatedName, floor: validatedFloor, type: validatedType, campus: validatedCampus, department_id: validatedDeptId } = value;

    const result = await pool.query(
      `UPDATE rooms
       SET name=$1, floor=$2, type=$3, campus=$4, department_id=$5, updated_at=NOW()
       WHERE id=$6
       RETURNING *`,
      [validatedName, validatedFloor, validatedType, validatedCampus, validatedDeptId, id]
    );

    if (!result.rows.length) return res.status(404).json({ message: "Room not found" });

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL (ADVANCED) =================

const getRooms = async (req, res) => {
  try {
    let { page = 0, size = 10, sort = "id,asc", q = "", campus, floor, type, department } = req.query;
    page = parseInt(page);
    size = parseInt(size);

    let [sortField, sortOrder] = sort.split(",");
    const validSortFields = ["id", "name", "floor", "type", "campus", "department_id", "created_at"];
    if (!validSortFields.includes(sortField)) sortField = "id";
    sortOrder = sortOrder?.toLowerCase() === "desc" ? "DESC" : "ASC";

    let filters = [];
    let params = [];
    let index = 1;

    // Search
    if (q) {
      filters.push(`(r.name ILIKE $${index} OR r.floor::text ILIKE $${index})`);
      params.push(`%${q}%`);
      index++;
    }

    // Campus filter
    if (campus) {
      filters.push(`r.campus = $${index}`);
      params.push(campus);
      index++;
    }

    // Floor filter
    if (floor) {
      filters.push(`r.floor = $${index}`);
      params.push(floor);
      index++;
    }

    // Type filter
    if (type) {
      filters.push(`r.type = $${index}`);
      params.push(type);
      index++;
    }

    // Department filter
    if (department) {
      if (department === "null") filters.push(`r.department_id IS NULL`);
      else {
        filters.push(`r.department_id = $${index}`);
        params.push(department);
        index++;
      }
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const offset = page * size;

    // 🔹 TOTAL COUNT
    const totalQuery = `SELECT COUNT(*) FROM rooms r ${whereClause}`;
    const totalResult = await pool.query(totalQuery, params);
    const total = parseInt(totalResult.rows[0].count);

    // 🔹 DATA QUERY
    const dataQuery = `
      SELECT r.*, d.name AS department_name
      FROM rooms r
      LEFT JOIN departments d ON r.department_id = d.id
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${index} OFFSET $${index + 1}
    `;
    const dataResult = await pool.query(dataQuery, [...params, size, offset]);

    // 🔹 Department list (for select)
    const depResult = await pool.query(`SELECT id, name FROM departments ORDER BY name ASC`);
    const departmentList = depResult.rows.map(dep => ({
      id: dep.id,
      name: dep.name || "Boshqa bo‘lim"
    }));

    return res.status(200).json({
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
      content: dataResult.rows,
      departmentList
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= GET BY ID =================

const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT r.*, d.name AS department_name
       FROM rooms r
       LEFT JOIN departments d ON r.department_id = d.id
       WHERE r.id=$1`,
      [id]
    );

    if (!result.rows.length) return res.status(404).json({ message: "Room not found" });

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};



// ================= DELETE =================

const deleteRoom = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "super_admin") {
      return res.status(403).json({ message: "Only super_admin can delete" });
    }

    const { id } = req.params;

    const result = await pool.query(`DELETE FROM rooms WHERE id=$1 RETURNING *`, [id]);
    if (!result.rows.length) return res.status(404).json({ message: "Room not found" });

    return res.status(200).json({ message: "Room deleted", room: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom
};