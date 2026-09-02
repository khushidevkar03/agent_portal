const db = require("../config/env");

const authenticateAgent = async (req, res, next) => {
  try {
    const authorization = req.get("authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "").trim();
    if (!token || token.length > 512) throw new Error("invalid token");
    const [rows] = await db.query(
      "SELECT t.admin_id AS adminId, l.id AS loginId, l.username, l.email, l.name FROM admins_access_tokens t INNER JOIN admin_logins l ON l.admin_id = t.admin_id AND l.status = 1 AND l.can_access_agent_portal = 1 INNER JOIN admins a ON a.id = l.admin_id AND a.is_active = 1 AND a.is_deleted = 0 WHERE t.access_token = ? LIMIT 1",
      [token],
    );
    if (!rows[0]) throw new Error("invalid token");
    req.agent = rows[0];
    next();
  } catch (_) {
    res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }
};

module.exports = { authenticateAgent };
