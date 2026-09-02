const { getServiceSpecificBookings } = require("../module/service-specific-bookings.module");

const getBookings = (service) => async (req, res, next) => {
  try {
    const agentId = Number.parseInt(req.query.agent_id, 10);
    if (!Number.isInteger(agentId) || agentId <= 0) {
      return res.status(400).json({ success: false, message: "A valid agent_id is required" });
    }
    const data = await getServiceSpecificBookings({
      service,
      agentId,
      from: req.query.from,
      to: req.query.to,
      status: req.query.status,
      search: req.query.search,
    });
    res.json({ success: true, service, count: data.length, data });
  } catch (error) { next(error); }
};

module.exports = { getBookings };
