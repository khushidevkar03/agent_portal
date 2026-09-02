const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("../config/env");

const verifyPassword = (input, stored) => {
  if (!stored) return false;
  // Supports the common PHP password_hash format used by legacy deployments.
  if (/^\$2[aby]?\$/.test(stored))
    return bcrypt.compareSync(String(input), String(stored));
  const inputBuffer = Buffer.from(String(input));
  const storedBuffer = Buffer.from(String(stored));
  if (/^[a-f0-9]{32}$/i.test(String(stored))) {
    const legacyHash = crypto.createHash("md5").update(String(input)).digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(legacyHash),
      Buffer.from(String(stored).toLowerCase()),
    );
  }
  return (
    inputBuffer.length === storedBuffer.length &&
    crypto.timingSafeEqual(inputBuffer, storedBuffer)
  );
};

const getAccessToken = async (adminId) => {
  const [rows] = await db.query(
    "SELECT access_token FROM admins_access_tokens WHERE admin_id = ? ORDER BY created DESC, id DESC LIMIT 1",
    [adminId],
  );
  if (rows[0]) return rows[0].access_token;
  const token = crypto.randomBytes(32).toString("hex");
  await db.query(
    "INSERT INTO admins_access_tokens (admin_id, access_token, created) VALUES (?, ?, NOW())",
    [adminId, token],
  );
  return token;
};

const recordAudit = async ({ loginId, adminId, eventType, ipAddress, userAgent, metadata }) => {
  await db.query(
    "INSERT INTO agent_portal_audit_log (login_id, admin_id, event_type, ip_address, user_agent, metadata) VALUES (?, ?, ?, ?, ?, ?)",
    [loginId || null, adminId || null, eventType, ipAddress || null, userAgent || null, metadata ? JSON.stringify(metadata) : null],
  );
};

const linkReferredClient = async ({ agentId, clientId }) => {
  if (!Number.isInteger(agentId) || !Number.isInteger(clientId) || agentId === clientId) {
    const error = new Error("An agent cannot refer itself");
    error.statusCode = 400;
    throw error;
  }
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [clientRows] = await connection.query("SELECT id FROM admins WHERE id = ? FOR UPDATE", [clientId]);
    if (!clientRows[0]) {
      const error = new Error("Referred client not found");
      error.statusCode = 404;
      throw error;
    }
    const [cycleRows] = await connection.query(
      "WITH RECURSIVE agent_chain AS (SELECT id, agent_id FROM admins WHERE id = ? UNION ALL SELECT a.id, a.agent_id FROM admins a INNER JOIN agent_chain c ON a.id = c.agent_id WHERE c.agent_id IS NOT NULL) SELECT id FROM agent_chain WHERE id = ? LIMIT 1",
      [clientId, agentId],
    );
    if (cycleRows[0]) {
      const error = new Error("This link would create a circular agent relationship");
      error.statusCode = 409;
      throw error;
    }
    await connection.query("UPDATE admins SET agent_id = ? WHERE id = ?", [agentId, clientId]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const login = async ({ username, password, auditContext = {} }) => {
  const [rows] = await db.query(
    "SELECT l.id, l.admin_id, l.email, l.username, l.password, l.name, l.status, l.can_access_agent_portal, a.is_active, a.is_deleted , a.corporate_name , a.corporate_code FROM admin_logins l INNER JOIN admins a ON a.id = l.admin_id WHERE (l.username = ? OR l.email = ?) LIMIT 1",
    [username, username],
  );
  const user = rows[0];
  const valid = user && Number(user.status) === 1 && Number(user.is_active) === 1 && Number(user.is_deleted) !== 1 && Number(user.can_access_agent_portal) === 1 && verifyPassword(password, user.password);
  await recordAudit({ ...auditContext, loginId: user && user.id, adminId: user && user.admin_id, eventType: valid ? "LOGIN_SUCCESS" : "LOGIN_FAILED", metadata: { username } });
  if (!valid) return null;
  return {
    id: user.id,
    adminId: user.admin_id,
    name: user.name,
    username: user.username || user.email,
    accessToken: await getAccessToken(user.admin_id),
    companyId: user.corporate_code || null,
    companyName: user.corporate_name || null,
  };
};

module.exports = { login, linkReferredClient };
