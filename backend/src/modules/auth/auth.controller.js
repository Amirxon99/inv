const pool = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ms = require("ms");

const ACCESS_EXPIRE = process.env.ACCESS_TOKEN_EXPIRE || "15m";
const REFRESH_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || "7d";

// ================= GENERATE TOKENS =================
const generateTokens = async (user, oldRefreshToken = null) => {
  const payload = { id: user.id, role: user.role };

  // Access token
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_EXPIRE,
  });

  // Refresh token
  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: REFRESH_EXPIRE,
  });

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  const expiresDate = new Date(Date.now() + ms(REFRESH_EXPIRE));

  // Rotation: eski token revoke
  if (oldRefreshToken) {
    await pool.query(
      "UPDATE user_tokens SET revoked_at=NOW() WHERE refresh_token=$1",
      [oldRefreshToken]
    );
  }

  // Yangi refresh token DBga qo‘yish
  await pool.query(
    "INSERT INTO user_tokens (user_id, refresh_token, expires_at) VALUES ($1,$2,$3)",
    [user.id, hashedRefreshToken, expiresDate]
  );

  return { accessToken, refreshToken };
};

// ================= LOGIN =================
const login = async (req, res) => {
   
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE username=$1",
      [username]
    );
     if (!result.rows[0])
      return res.status(401).json({ message: "Invalid credentials" });

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const tokens = await generateTokens(user);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= REFRESH TOKEN (body orqali) =================
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken)
      return res.status(401).json({ message: "No refresh token provided" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // DBdagi user tokenlarini tekshirish
    const tokensResult = await pool.query(
      "SELECT * FROM user_tokens WHERE user_id=$1 AND revoked_at IS NULL AND expires_at > NOW()",
      [decoded.id]
    );

    let validTokenRow = null;

    for (const row of tokensResult.rows) {
      const isMatch = await bcrypt.compare(refreshToken, row.refresh_token);
      if (isMatch) {
        validTokenRow = row;
        break;
      }
    }

    if (!validTokenRow) {
      // Reuse attack -> barcha tokenlarni revoke qilamiz
      await pool.query(
        "UPDATE user_tokens SET revoked_at=NOW() WHERE user_id=$1",
        [decoded.id]
      );

      return res.status(403).json({ message: "Token reuse detected" });
    }

    // Userni olish
    const userResult = await pool.query(
      "SELECT * FROM users WHERE id=$1",
      [decoded.id]
    );

    const user = userResult.rows[0];

    // Yangi tokens yaratish (rotation)
    const tokens = await generateTokens(user, validTokenRow.refresh_token);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

// ================= GET ME =================
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, role, first_name, last_name FROM users WHERE id=$1",
      [req.user.id]
    );

    if (!result.rows[0])
      return res.status(404).json({ message: "User not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGOUT CURRENT DEVICE =================
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) return res.status(204).send();

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    await pool.query(
      "UPDATE user_tokens SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL",
      [decoded.id]
    );

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(204).send();
  }
};

// ================= LOGOUT ALL DEVICES =================
const logoutAll = async (req, res) => {
  try {
    await pool.query(
      "UPDATE user_tokens SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL",
      [req.user.id]
    );

    res.json({ message: "Logged out from all devices" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  login,
  refresh,
  getMe,
  logout,
  logoutAll,
};