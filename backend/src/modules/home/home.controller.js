const pool = require("../../config/db");

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Tanlangan yilni query'dan olamiz, bo'lmasa hozirgi yilni oladi
    const selectedYear = req.query.year || new Date().getFullYear();

    // 2. KPI so'rovlari (Bular odatda umumiy miqdorlar)
    const kpiQueries = [
      pool.query(`SELECT COUNT(*) FROM assets`),
      pool.query(`SELECT COUNT(*) FROM users`),
      pool.query(`SELECT COUNT(*) FROM rooms`),
      pool.query(`SELECT COUNT(*) FROM departments`)
    ];

    // Barcha KPI so'rovlarini bir vaqtda ishlatamiz (Performance uchun)
    const [assetsRes, usersRes, roomsRes, deptsRes] = await Promise.all(kpiQueries);

    // 3. Jihozlar holati (Asset status - Pie Chart uchun)
    const assetStatus = await pool.query(`
      SELECT status, COUNT(*)::int as count 
      FROM assets 
      GROUP BY status
    `);

    // 4. Inventarizatsiya natijalari (Bar Chart uchun - Yil bo'yicha filtr)
    const inventoryResults = await pool.query(`
      SELECT status, COUNT(*)::int as count
      FROM asset_inventory
      WHERE EXTRACT(YEAR FROM created_at) = $1
      GROUP BY status
    `, [selectedYear]);

    // 5. Oxirgi harakatlar tarixi (Table uchun - Yil bo'yicha filtr)
    const recentMovements = await pool.query(`
      SELECT 
        am.id,
        a.name AS asset_name,
        fr.name AS from_room,
        tr.name AS to_room,
        u.first_name,
        am.moved_at
      FROM asset_movements am
      LEFT JOIN assets a ON am.asset_id = a.id
      LEFT JOIN rooms fr ON am.from_room_id = fr.id
      LEFT JOIN rooms tr ON am.to_room_id = tr.id
      LEFT JOIN users u ON am.moved_by = u.id
      WHERE EXTRACT(YEAR FROM am.moved_at) = $1
      ORDER BY am.moved_at DESC
      LIMIT 10
    `, [selectedYear]);

    // 6. Topilmagan jihozlar (Alert uchun)
    const notFoundAssets = await pool.query(`
      SELECT id, name, inv_number
      FROM assets
      WHERE status = 'not_found'
    `);

    // 7. Javobni shakllantirish
    res.status(200).json({
      kpi: {
        assets: parseInt(assetsRes.rows[0].count),
        users: parseInt(usersRes.rows[0].count),
        rooms: parseInt(roomsRes.rows[0].count),
        departments: parseInt(deptsRes.rows[0].count),
      },
      assetStatus: assetStatus.rows,
      inventoryResults: inventoryResults.rows,
      recentMovements: recentMovements.rows,
      notFoundAssets: notFoundAssets.rows,
      year: selectedYear
    });

  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Dashboard ma'lumotlarini yuklashda xatolik yuz berdi",
      error: error.message
    });
  }
};