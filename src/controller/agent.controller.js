const { login, linkReferredClient } = require("../module/agent.module");

const signIn = async (req, res, next) => {
  try {
    const username =
      typeof req.body.username === "string" ? req.body.username.trim() : "";
    const password =
      typeof req.body.password === "string" ? req.body.password : "";
    if (!username || !password)
      return res
        .status(400)
        .json({
          success: false,
          message: "Username and password are required",
        });
    const user = await login({ username, password, auditContext: { ipAddress: req.ip, userAgent: req.get("user-agent") } });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    res.json({
      success: true,
      data: {
        // token: user.accessToken,
        access_token: user.accessToken,
        user: {
          id: user.id,
          adminId: user.adminId,
          name: user.name,
          username: user.username,
          companyId: user.companyId,
          companyName: user.companyName,
        },
      },
    });
  } catch (e) {
    next(e);
  }
};

const referClient = async (req, res, next) => {
  try {
    const clientId = Number.parseInt(req.params.clientId, 10);
    await linkReferredClient({ agentId: req.agent.adminId, clientId });
    res.json({ success: true, message: "Client linked to agent successfully" });
  } catch (e) { next(e); }
};

module.exports = { signIn, referClient };
