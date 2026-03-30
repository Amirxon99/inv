const pool = require("../../config/db");


exports.getUserAssets = async (req, res) => {
  const userId = req.params.userId;

  try {
    const assets = await pool.query(
      `SELECT ua.id, a.id AS asset_id, a.name AS asset_name, a.inv_number, a.status
       FROM user_assets ua
       LEFT JOIN assets a ON ua.asset_id = a.id
       WHERE ua.user_id = $1`,
      [userId]
    );

    res.json(assets.rows);
  } catch (error) {
    console.error("GET USER ASSETS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


exports.addUserAsset = async (req, res) => {
  const userId = req.params.userId;
  const { inv_number } = req.body;

  try {

    const assetRes = await pool.query(
      `SELECT id, name AS asset_name, inv_number, status FROM assets WHERE inv_number = $1`,
      [inv_number]
    );

    if (assetRes.rows.length === 0) {
      return res.status(404).json({ message: "Asset topilmadi" });
    }

    const asset = assetRes.rows[0];

   
    const exists = await pool.query(
      `SELECT * FROM user_assets WHERE user_id = $1 AND asset_id = $2`,
      [userId, asset.id]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "Asset allaqachon foydalanuvchiga biriktirilgan" });
    }

  
    const insertRes = await pool.query(
      `INSERT INTO user_assets(user_id, asset_id) VALUES($1, $2) RETURNING id`,
      [userId, asset.id]
    );

    res.status(201).json({
      id: insertRes.rows[0].id,
      asset_id: asset.id,
      asset_name: asset.asset_name,
      inv_number: asset.inv_number,
      status: asset.status
    });
  } catch (error) {
    console.error("ADD USER ASSET ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


exports.deleteUserAsset = async (req, res) => {
  const userId = req.params.userId;
  const assetId = req.params.assetId;

  try {
    const delRes = await pool.query(
      `DELETE FROM user_assets WHERE user_id = $1 AND id = $2 RETURNING *`,
      [userId, assetId]
    );

    if (delRes.rows.length === 0) {
      return res.status(404).json({ message: "Asset topilmadi yoki foydalanuvchiga biriktirilmagan" });
    }

    res.json({ message: "Asset foydalanuvchidan o‘chirildi", deletedAsset: delRes.rows[0] });
  } catch (error) {
    console.error("DELETE USER ASSET ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};