const pool = require("../../config/db");
const Joi = require("joi");

// ================= VALIDATION =================
const assetCategorySchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().allow("", null)
});

// ================= CREATE =================
const createCategory = async (req, res) => {
  try {
    const { role } = req.user;

    if (!["super_admin", "admin"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { name, description } = req.body;

    const { error, value } = assetCategorySchema.validate({ name, description });

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // 🔹 duplicate name check
    const exists = await pool.query(
      `SELECT id FROM asset_categories WHERE LOWER(name)=LOWER($1)`,
      [value.name]
    );

    if (exists.rows.length) {
      return res.status(400).json({ message: "Bu kategoriya allaqachon mavjud" });
    }

    const result = await pool.query(
      `INSERT INTO asset_categories (name, description, created_at)
       VALUES ($1,$2,NOW())
       RETURNING id,name,description`,
      [value.name, value.description]
    );

    return res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL =================
const getCategories = async (req, res) => {
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

    const totalResult = await pool.query(
      `SELECT COUNT(*) FROM asset_categories ${whereClause}`,
      params
    );

    const total = parseInt(totalResult.rows[0].count);

    const dataQuery = `
      SELECT id,name,description
      FROM asset_categories
      ${whereClause}
      ORDER BY id ASC
      LIMIT $${idx} OFFSET $${idx+1}
    `;

    const dataResult = await pool.query(dataQuery, [...params, size, offset]);

    return res.status(200).json({
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
      content: dataResult.rows
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= GET BY ID =================
const getCategoryById = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      `SELECT id,name,description
       FROM asset_categories
       WHERE id=$1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE =================
const updateCategory = async (req, res) => {
  try {

    const { role } = req.user;

    if (!["super_admin", "admin"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { id } = req.params;
    const { name, description } = req.body;

    const { error, value } = assetCategorySchema.validate({ name, description });

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // 🔹 duplicate check
    const exists = await pool.query(
      `SELECT id FROM asset_categories
       WHERE LOWER(name)=LOWER($1) AND id<>$2`,
      [value.name, id]
    );

    if (exists.rows.length) {
      return res.status(400).json({ message: "Bu kategoriya allaqachon mavjud" });
    }

    const result = await pool.query(
      `UPDATE asset_categories
       SET name=$1,
           description=$2
       WHERE id=$3
       RETURNING id,name,description`,
      [value.name, value.description, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= DELETE =================
const deleteCategory = async (req, res) => {
  try {

    const { role } = req.user;

    if (role !== "super_admin") {
      return res.status(403).json({ message: "Only super_admin can delete" });
    }

    const { id } = req.params;

    // 🔹 check assets using this category
    const assetCheck = await pool.query(
      `SELECT id FROM assets WHERE category_id=$1 LIMIT 1`,
      [id]
    );

    if (assetCheck.rows.length) {
      return res.status(400).json({
        message: "Bu kategoriya ishlatilmoqda. Avval assetlarni o‘zgartiring."
      });
    }

    const result = await pool.query(
      `DELETE FROM asset_categories
       WHERE id=$1
       RETURNING id,name`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({
      message: "Category deleted",
      category: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};