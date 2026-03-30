const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// Auth middleware — token tekshiradi va req.user ga user obj qo‘yadi
module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ message: "Unauthorized" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      "SELECT id, username, role, department_id FROM users WHERE id=$1",
      [decoded.id]
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: "User not found" });

    // req.user ga saqlaymiz
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      department_id: user.department_id,
    };

    next();
  } catch (err) {
    console.error(err);

    if (err.name === "TokenExpiredError")
      return res.status(401).json({ message: "Token expired" });

    return res.status(401).json({ message: "Invalid token" });
  }
};