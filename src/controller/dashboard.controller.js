const { getDashboard } = require("../module/dashboard.module");

const dashboard = async (req, res, next) => {
  try {
    const agentId = Number.parseInt(req.query.agent_id, 10);
    if (!Number.isInteger(agentId) || agentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid agent_id is required",
      });
    }
    const data = await getDashboard(agentId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { dashboard };
