const pool = require("../../config/db");

// 🔹 GET ASSET MOVEMENTS (bazaga mos)
const getAssetsMovements = async (req, res) => {
  try {
    let { page = 0, size = 10, sort = "moved_at,desc", q = "" } = req.query;
    page = parseInt(page);
    size = parseInt(size);

    let [sortField, sortOrder] = sort.split(",");
    const validFields = [
      "id",
      "asset_name",
      "inv_number",
      "price",
      "from_room_name",
      "to_room_name",
      "moved_by_name",
      "moved_at"
    ];
    if (!validFields.includes(sortField)) sortField = "moved_at";
    sortOrder = sortOrder?.toLowerCase() === "desc" ? "DESC" : "ASC";

    const offset = page * size;
    const filters = [];
    const values = [];
    let idx = 1;

    // 🔹 Search by asset name or inventory number
    if (q) {
      filters.push(`(a.name ILIKE $${idx} OR a.inv_number ILIKE $${idx})`);
      values.push(`%${q}%`);
      idx++;
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    // 🔹 Total count
    const totalResult = await pool.query(
      `SELECT COUNT(*) 
       FROM asset_movements am
       LEFT JOIN assets a ON am.asset_id = a.id
       LEFT JOIN rooms r1 ON am.from_room_id = r1.id
       LEFT JOIN rooms r2 ON am.to_room_id = r2.id
       LEFT JOIN users u ON am.moved_by = u.id
       ${whereClause}`,
      values
    );
    const total = parseInt(totalResult.rows[0].count);

    // 🔹 Sorting
    let orderClause = `am.${sortField} ${sortOrder}`;
    if (sortField === "asset_name") orderClause = `a.name ${sortOrder}`;
    if (sortField === "inv_number") orderClause = `a.inv_number ${sortOrder}`;
    if (sortField === "price") orderClause = `a.price ${sortOrder}`;
    if (sortField === "from_room_name") orderClause = `r1.name ${sortOrder}`;
    if (sortField === "to_room_name") orderClause = `r2.name ${sortOrder}`;
    if (sortField === "moved_by_name") orderClause = `u.first_name ${sortOrder}`; // agar full_name bo'lsa, o'zgartiring
    if (sortField === "moved_at") orderClause = `am.moved_at ${sortOrder}`;

    // 🔹 Movements query
    const movementsResult = await pool.query(
      `SELECT 
         am.id,
         a.name AS asset_name,
         a.inv_number,
         a.price,
         r1.name AS from_room_name,
         r2.name AS to_room_name,
         CONCAT(u.first_name, ' ', u.last_name) AS moved_by_name,
         am.moved_at,
         am.notes
       FROM asset_movements am
       LEFT JOIN assets a ON am.asset_id = a.id
       LEFT JOIN rooms r1 ON am.from_room_id = r1.id
       LEFT JOIN rooms r2 ON am.to_room_id = r2.id
       LEFT JOIN users u ON am.moved_by = u.id
       ${whereClause}
       ORDER BY ${orderClause}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, size, offset]
    );

    res.status(200).json({
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
      content: movementsResult.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAssetsMovements
};