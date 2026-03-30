const pool = require("../../config/db");

// 🔹 1. START SESSION
exports.startSession = async (req, res) => {
  const client = await pool.connect();
  try {
    const { room_id, year, name } = req.body;
    const user_id = req.user.id;
    const sessionName = name || `${year}-yilgi xatlov`;

    await client.query("BEGIN");

    // 1️⃣ Ochiq sessiya mavjudligini tekshirish
    const openSessionRes = await client.query(
      "SELECT s.*, r.name as room_name FROM inventory_sessions s JOIN rooms r ON s.room_id = r.id WHERE s.room_id = $1 AND s.status = 'open'",
      [room_id]
    );

    if (openSessionRes.rows.length > 0) {
      await client.query("COMMIT");
      return res.status(200).json({
        message: "Ochiq sessiya mavjud",
        session: openSessionRes.rows[0]
      });
    }

    // 2️⃣ Yopilgan sessiyalarni topish (agar qayta ochish kerak bo'lsa)
    const closedSessionRes = await client.query(
      "SELECT * FROM inventory_sessions WHERE room_id = $1 AND status = 'closed' ORDER BY finished_at DESC LIMIT 1",
      [room_id]
    );

    if (closedSessionRes.rows.length > 0) {
      const closedSession = closedSessionRes.rows[0];
      const updateRes = await client.query(
        "UPDATE inventory_sessions SET status = 'open', started_by = $1, name = $2, finished_at = NULL WHERE id = $3 RETURNING *",
        [user_id, sessionName, closedSession.id]
      );
      await client.query("COMMIT");
      return res.status(200).json({
        message: "Yopilgan sessiya qayta ochildi",
        session: updateRes.rows[0]
      });
    }

    // 3️⃣ Yangi sessiya yaratish
    const insertRes = await client.query(
      `INSERT INTO inventory_sessions (room_id, year, name, started_by, status)
       VALUES ($1, $2, $3, $4, 'open') RETURNING *`,
      [parseInt(room_id), parseInt(year), sessionName, user_id]
    );
    const newSession = insertRes.rows[0];

    // 🚀 Xonadagi barcha mavjud jihozlarni 'not_found' statusi bilan kiritish
    // Bu yerda room_id sessiya xonasi bilan bir xil bo'ladi (Kutilayotganlar)
    await client.query(
      `INSERT INTO asset_inventory (asset_id, session_id, status, room_id, verified_at)
       SELECT id, $1, 'not_found', room_id, NOW()
       FROM assets 
       WHERE room_id = $2`,
      [newSession.id, room_id]
    );

    await client.query("COMMIT");
    res.status(201).json({
      message: "Yangi sessiya ochildi",
      session: newSession
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Sessiya ochishda xatolik", error: error.message });
  } finally {
    client.release();
  }
};

// 🔹 2. SCAN ASSET
exports.scanAsset = async (req, res) => {
  const { session_id, qr_token } = req.body;
  const user_id = req.user.id;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Jihozni topish
    const assetRes = await client.query("SELECT * FROM assets WHERE qr_token = $1", [qr_token]);
    const asset = assetRes.rows[0];
    if (!asset) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Jihoz topilmadi" });
    }

    // 2️⃣ Sessiyani tekshirish
    const sessionRes = await client.query("SELECT * FROM inventory_sessions WHERE id = $1 AND status = 'open'", [session_id]);
    const session = sessionRes.rows[0];
    if (!session) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Faol sessiya topilmadi" });
    }

    // 3️⃣ Jihoz kutilganmi yoki yo'q (ro'yxatda borligini tekshirish)
    const existsRes = await client.query(
      "SELECT id, status, room_id FROM asset_inventory WHERE asset_id = $1 AND session_id = $2",
      [asset.id, session_id]
    );

    const is_expected = existsRes.rows.length > 0 && existsRes.rows[0].room_id === session.room_id;
    let moved = false;

    // 4️⃣ Agar jihoz boshqa xonadan kelgan bo'lsa (Moved logic)
    if (asset.room_id !== session.room_id) {
      moved = true;
      // Harakatlar tarixiga yozish
      await client.query(
        `INSERT INTO asset_movements (asset_id, from_room_id, to_room_id, moved_by, status)
         VALUES ($1, $2, $3, $4, 'auto_move')`,
        [asset.id, asset.room_id, session.room_id, user_id]
      );
      // Asosiy bazada jihozning xonasini yangilash
      await client.query("UPDATE assets SET room_id = $1 WHERE id = $2", [session.room_id, asset.id]);
    }

    // 5️⃣ Inventarizatsiya holatini yangilash (ON CONFLICT ishlatiladi)
    // Agar kutilmagan (begona) jihoz bo'lsa, room_id sifatida assetning eski xonasi saqlanadi (virtual farqlash uchun)
    await client.query(
      `INSERT INTO asset_inventory (asset_id, session_id, status, room_id, verified_by, verified_at)
       VALUES ($1, $2, 'active', $3, $4, NOW())
       ON CONFLICT (asset_id, session_id) DO UPDATE 
       SET status = 'active', verified_at = NOW(), verified_by = EXCLUDED.verified_by`,
      [asset.id, session_id, asset.room_id, user_id]
    );

    await client.query("COMMIT");
    res.json({ 
      status: "scanned", 
      is_extra: !is_expected, // Frontendda "Yangi qo'shildi" deb chiqarish uchun
      moved, 
      asset 
    });

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

// 🔹 3. GET SESSION ASSETS
exports.getSessionAssets = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Sessiya xonasini bilishimiz kerak
    const sessionRes = await pool.query("SELECT room_id FROM inventory_sessions WHERE id = $1", [sessionId]);
    if (sessionRes.rows.length === 0) return res.status(404).json({ message: "Sessiya topilmadi" });
    const sessionRoomId = sessionRes.rows[0].room_id;

    const query = `
      SELECT 
        a.id, a.name, a.inv_number, ai.status, ai.verified_at,
        CASE WHEN ai.room_id = $2 THEN TRUE ELSE FALSE END as is_expected
      FROM asset_inventory ai
      JOIN assets a ON ai.asset_id = a.id
      WHERE ai.session_id = $1
      ORDER BY is_expected DESC, ai.verified_at DESC
    `;
    const result = await pool.query(query, [sessionId, sessionRoomId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Ro'yxatni olishda xatolik" });
  }
};

// 🔹 4. GET SESSION INFO
exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const query = `
      SELECT s.*, r.name as room_name
      FROM inventory_sessions s
      JOIN rooms r ON s.room_id = r.id
      WHERE s.id = $1
    `;
    const result = await pool.query(query, [sessionId]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Sessiya topilmadi" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Xatolik yuz berdi" });
  }
};

// 🔹 5. FINISH SESSION
exports.finishSession = async (req, res) => {
  const { sessionId } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const sessionRes = await client.query("SELECT room_id FROM inventory_sessions WHERE id = $1 AND status = 'open'", [sessionId]);
    if (sessionRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Faol sessiya topilmadi" });
    }
    const sessionRoomId = sessionRes.rows[0].room_id;

    // To'liq statistika tayyorlash
    const statsRes = await client.query(
      `SELECT 
        COUNT(*) FILTER (WHERE room_id = $2) as expected_total,
        COUNT(*) FILTER (WHERE room_id = $2 AND status = 'active') as found,
        COUNT(*) FILTER (WHERE room_id = $2 AND status = 'not_found') as missing,
        COUNT(*) FILTER (WHERE room_id != $2) as extra
       FROM asset_inventory 
       WHERE session_id = $1`,
      [sessionId, sessionRoomId]
    );

    const stats = statsRes.rows[0];

    await client.query(
      "UPDATE inventory_sessions SET status = 'closed', finished_at = NOW() WHERE id = $1",
      [sessionId]
    );

    await client.query("COMMIT");

    res.json({
      message: "Sessiya muvaffaqiyatli yakunlandi",
      stats: {
        expected_total: parseInt(stats.expected_total),
        found: parseInt(stats.found),
        missing: parseInt(stats.missing),
        extra: parseInt(stats.extra),
        total_in_room: parseInt(stats.found) + parseInt(stats.extra)
      }
    });

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Yakunlashda xatolik", error: error.message });
  } finally {
    client.release();
  }
};