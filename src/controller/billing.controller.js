const { getBilling } = require("../module/billing.module");

const billing = async (req, res, next) => {
  try {
    const agentId = Number.parseInt(req.body.agent_id, 10);
    const type = Number.parseInt(req.body.type, 10);
    if (!Number.isInteger(agentId) || agentId <= 0) {
      return res.status(400).json({ success: false, error: "A valid agent_id is required" });
    }
    if (!Number.isInteger(type) || type < 0) {
      return res.status(400).json({ success: false, error: "type must be a non-negative status value" });
    }
    const result = await getBilling({ agentId, type });
    res.json({
      success: "1",
      error: "",
      response: {
        Bills: result.bills,
        total: result.total,
      },
    });
  } catch (error) { next(error); }
};

module.exports = { billing };
