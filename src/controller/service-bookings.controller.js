const { getServiceBookings } = require("../module/service-bookings.module");
const { unifiedBookingSchema } = require("../config/unified-booking.schema");

const serviceBookings = async (req, res, next) => {
  try {
    const agentId = Number.parseInt(req.body.agent_id, 10);
    const service = req.body.service ? String(req.body.service).toLowerCase() : undefined;
    if (!Number.isInteger(agentId) || agentId <= 0) {
      return res.status(400).json({ success: false, message: "A valid agent_id is required" });
    }
    if (service && !unifiedBookingSchema[service]) {
      return res.status(400).json({ success: false, message: "Unsupported service" });
    }
    const data = await getServiceBookings({
      agentId,
      service,
      from: req.body.from,
      to: req.body.to,
      status: req.body.status,
      search: req.body.search,
    });
    res.json({
      success: true,
      serviceCounts: Object.fromEntries(Object.entries(data).map(([name, bookings]) => [name, bookings.length])),
      data,
    });
  } catch (error) { next(error); }
};

module.exports = { serviceBookings };
