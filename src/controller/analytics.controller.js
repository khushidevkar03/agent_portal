const { getAnalytics } = require("../module/analytics.module");

const analytics = async (req, res, next) => {
  try {
    const agentId = Number.parseInt(req.body.agent_id, 10);
    if (!Number.isInteger(agentId) || agentId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "A valid agent_id is required" });
    }
    const adminId = Number.parseInt(req.body.admin_id, 10);
    const month = typeof req.body.month === "string" ? req.body.month : undefined;
    const data = await getAnalytics(agentId, {
      adminId: Number.isInteger(adminId) && adminId > 0 ? adminId : undefined,
      month,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { analytics };
