const { getRecentActivity } = require("../module/recent-activity.module");

const recentActivity = async (req, res, next) => {
  try {
    const agentId = Number.parseInt(req.query.agent_id, 10);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    if (!Number.isInteger(agentId) || agentId <= 0) {
      return res.status(400).json({ success: false, message: "A valid agent_id is required" });
    }
    const data = await getRecentActivity(agentId, limit);
    const BookingsCount = data.length;
    res.json({ success: true, BookingsCount, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { recentActivity };
