const pool = require("../../config/db");
const Joi = require("joi");

// ================= VALIDATION =================
const departmentSchema = Joi.object({
  name: Joi.string().required()
});

// ================= CREATE =================
const createDepartment = async (req, res) => {
  try {
    const { role } = req.user;
    if (!["super_admin", "admin"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { name } = req.body;
    const { error, value } = departmentSchema.validate({ name });
    if (error) return res.status(400).json({ message: error.details[0].message });

    const result = await pool.query(
      `INSERT INTO departments (name, created_at, updated_at)
       VALUES ($1, NOW(), NOW())
       RETURNING id, name`,
      [value.name]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL =================
const getDepartments = async (req, res) => {
  try {
    let { page = 0, size = 10, q = "" } = req.query;
    page = parseInt(page);
    size = parseInt(size);
    const offset = page * size;

    const params = [];
    let filters = [];
    let idx = 1;

    if (q) {
      filters.push(`name ILIKE $${idx}`);
      params.push(`%${q}%`);
      idx++;
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    // 🔹 Total count
    const totalResult = await pool.query(`SELECT COUNT(*) FROM departments ${whereClause}`, params);
    const total = parseInt(totalResult.rows[0].count);

    // 🔹 Data query
    const dataQuery = `
      SELECT id, name
      FROM departments
      ${whereClause}
      ORDER BY id ASC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    const dataResult = await pool.query(dataQuery, [...params, size, offset]);

    return res.status(200).json({
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
      content: dataResult.rows  // 🔹 faqat content ichida departments
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= GET BY ID =================
const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT id, name FROM departments WHERE id=$1`, [id]);

    if (!result.rows.length) return res.status(404).json({ message: "Department not found" });

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE =================
const updateDepartment = async (req, res) => {
  try {
    const { role } = req.user;
    if (!["super_admin", "admin"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { id } = req.params;
    const { name } = req.body;
    const { error, value } = departmentSchema.validate({ name });
    if (error) return res.status(400).json({ message: error.details[0].message });

    const result = await pool.query(
      `UPDATE departments
       SET name=$1, updated_at=NOW()
       WHERE id=$2
       RETURNING id, name`,
      [value.name, id]
    );

    if (!result.rows.length) return res.status(404).json({ message: "Department not found" });

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= DELETE =================
const deleteDepartment = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "super_admin") {
      return res.status(403).json({ message: "Only super_admin can delete" });
    }

    const { id } = req.params;
    const result = await pool.query(`DELETE FROM departments WHERE id=$1 RETURNING id, name`, [id]);
    if (!result.rows.length) return res.status(404).json({ message: "Department not found" });

    return res.status(200).json({ message: "Department deleted", department: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
};