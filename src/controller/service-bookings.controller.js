const { getServiceBookings } = require("../module/service-bookings.module");
const { unifiedBookingSchema } = require("../config/unified-booking.schema");

const serviceBookings = async (req, res, next) => {
  try {
    const agentId = Number.parseInt(req.query.agent_id, 10);
    const service = req.query.service ? String(req.query.service).toLowerCase() : undefined;
    if (!Number.isInteger(agentId) || agentId <= 0) {
      return res.status(400).json({ success: false, message: "A valid agent_id is required" });
    }
    if (service && !unifiedBookingSchema[service]) {
      return res.status(400).json({ success: false, message: "Unsupported service" });
    }
    const data = await getServiceBookings({
      agentId,
      service,
      from: req.query.from,
      to: req.query.to,
      status: req.query.status,
      search: req.query.search,
    });
    res.json({
      success: true,
      serviceCounts: Object.fromEntries(Object.entries(data).map(([name, bookings]) => [name, bookings.length])),
      data,
    });
  } catch (error) { next(error); }
};

module.exports = { serviceBookings };
