const { getPaymentData } = require("../module/payment-data.module");

const paymentData = async (req, res, next) => {
  try {
    const agentId = Number.parseInt(req.body.agent_id, 10);
    if (!Number.isInteger(agentId) || agentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid agent_id is required",
      });
    }
    const data = await getPaymentData(agentId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { paymentData };
