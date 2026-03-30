const pool = require("../../config/db");
const bcrypt = require("bcryptjs");
const Joi = require("joi");

// --- Validation schema ---
const userSchema = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().allow(null, ""),
  middle_name: Joi.string().allow(null, ""),
  username: Joi.string().allow(null, ""), 
  password: Joi.string().min(6).allow(null, "").when("role", {
    is: Joi.valid("super_admin","admin","moderator","skladchi"),
    then: Joi.required()
  }),
  role: Joi.string()
    .valid("super_admin","admin","moderator","user","skladchi","employee")
    .default("employee"),
  department_id: Joi.number().allow(null), 
  room_id: Joi.number().allow(null),
  campus: Joi.string().valid("campus1","campus2").default("campus1")
});

// --- Helper functions ---
function generateUsername(first_name, last_name) {
  if (!first_name || !last_name) return `user${Date.now()}`;
  return `${first_name.toLowerCase()}.${last_name.toLowerCase()}.${Date.now()}`;
}

function generatePassword(first_name, last_name) {
  if (!first_name || !last_name) return `Password123`;
  return `${first_name[0].toUpperCase()}${last_name.toLowerCase()}@${Math.floor(Math.random()*1000)}`;
}

// --- CREATE USER ---
const createUser = async (req, res) => {
  try {
    const { role: creatorRole } = req.user;
    const { error, value } = userSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    let { first_name, last_name, middle_name, username, password, role, department_id, room_id, campus } = value;


    if (creatorRole === "admin" && ["admin","super_admin"].includes(role)) {
      return res.status(403).json({ message: "Admin cannot create admin or super_admin" });
    }
    if (!["super_admin","admin"].includes(creatorRole)) {
      return res.status(403).json({ message: "You are not allowed to create users" });
    }

    if (!username) username = generateUsername(first_name, last_name);
    if (!password) password = generatePassword(first_name, last_name);

    const existing = await pool.query("SELECT id FROM users WHERE username=$1", [username]);
    if (existing.rows.length) return res.status(400).json({ message: "Username already exists" });

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const result = await pool.query(
      `INSERT INTO users
       (first_name, last_name, middle_name, username, password, role, department_id, room_id, campus)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, first_name, last_name, middle_name, username, role, department_id, room_id, campus`,
      [first_name, last_name, middle_name, username, hashedPassword, role, department_id, room_id, campus]
    );

    return res.status(201).json({ message: "User created", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// --- UPDATE USER ---
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role: currentUserRole } = req.user;

    const schema = userSchema.fork(["password","username"], field => field.optional());
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    let { first_name, last_name, middle_name, username, password, role, department_id, room_id, campus } = value;

    if (currentUserRole === "admin" && ["admin","super_admin"].includes(role)) {
      return res.status(403).json({ message: "Admin cannot update admin or super_admin" });
    }

    if (!username && first_name && last_name && ["user","employee"].includes(role)) {
      username = generateUsername(first_name, last_name);
    }
    if (!password && first_name && last_name && ["user","employee"].includes(role)) {
      password = generatePassword(first_name, last_name);
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const result = await pool.query(
      `UPDATE users
       SET first_name=$1, last_name=$2, middle_name=$3, role=$4, department_id=$5, room_id=$6, campus=$7,
           username=COALESCE($8,username), password=COALESCE($9,password), updated_at=NOW()
       WHERE id=$10
       RETURNING id, first_name, last_name, middle_name, username, role, department_id, room_id, campus`,
      [first_name, last_name, middle_name, role, department_id, room_id, campus, username, hashedPassword, id]
    );

    if (!result.rows.length) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "User updated", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// --- GET USERS WITH DEPARTMENT LIST ---
const getUsers = async (req, res) => {
  try {
    let { page = 0, size = 10, sort = "id,asc", q = "", department } = req.query;
    page = parseInt(page);
    size = parseInt(size);

    let [sortField, sortOrder] = sort.split(",");
    const validFields = ["id","first_name","last_name","middle_name","username","role","department_id","campus"];
    if (!validFields.includes(sortField)) sortField = "id";
    sortOrder = sortOrder?.toLowerCase() === "desc" ? "DESC" : "ASC";

    const offset = page * size;

    const filters = [];
    const values = [];
    let idx = 1;

    if (q) {
      filters.push(`(u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx} OR u.middle_name ILIKE $${idx} OR u.username ILIKE $${idx})`);
      values.push(`%${q}%`);
      idx++;
    }

    if (department) {
      if (department === "null") filters.push(`u.department_id IS NULL`);
      else {
        filters.push(`u.department_id = $${idx}`);
        values.push(department);
        idx++;
      }
    }

    filters.push(`u.role <> 'super_admin'`);
    const whereClause = filters.length ? "WHERE " + filters.join(" AND ") : "";

    // --- Total users ---
    const totalResult = await pool.query(`SELECT COUNT(*) FROM users u ${whereClause}`, values);
    const total = parseInt(totalResult.rows[0].count);

    // --- Users list ---
    const result = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.middle_name, u.username, u.role, u.department_id,
              u.room_id, u.campus,
              r.name AS room_name,
              d.name AS department_name
       FROM users u
       LEFT JOIN rooms r ON u.room_id = r.id
       LEFT JOIN departments d ON u.department_id = d.id
       ${whereClause}
       ORDER BY u.${sortField} ${sortOrder}
       LIMIT $${idx} OFFSET $${idx+1}`,
      [...values, size, offset]
    );

    // --- Department list ---
    const departmentsResult = await pool.query(`SELECT id, name FROM departments ORDER BY name ASC`);
    const departmentList = departmentsResult.rows.map(dep => ({
      id: dep.id,
      name: dep.name || "Boshqa bo‘lim"
    }));

    return res.status(200).json({
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
      content: result.rows,
      departmentList
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// --- GET USER BY ID ---
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.middle_name, u.username, u.role, u.department_id,
              u.room_id, u.campus,
              r.name AS room_name,
              d.name AS department_name
       FROM users u
       LEFT JOIN rooms r ON u.room_id = r.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id=$1`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// --- DELETE USER ---
const deleteUser = async (req, res) => {
  try {
    const { role } = req.user;
    const { id } = req.params;

    if (role !== "super_admin") return res.status(403).json({ message: "Only super_admin can delete users" });

    const result = await pool.query("DELETE FROM users WHERE id=$1 RETURNING *", [id]);
    if (!result.rows.length) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ message: "User deleted", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createUser,
  updateUser,
  getUsers,
  getUserById,
  deleteUser
};