const { getUnifiedBookings } = require("../module/unified-booking.module");
const { unifiedBookingSchema } = require("../config/unified-booking.schema");

const unifiedBookings = async (req, res, next) => {
  try {
    const agentId = Number.parseInt(req.query.agent_id, 10);
    const service = req.query.service
      ? String(req.query.service).toLowerCase()
      : undefined;
    if (!Number.isInteger(agentId) || agentId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "A valid agent_id is required" });
    }
    if (service && !unifiedBookingSchema[service]) {
      return res
        .status(400)
        .json({ success: false, message: "Unsupported service" });
    }
    const result = await getUnifiedBookings({
      agentId,
      service,
      from: req.query.from,
      to: req.query.to,
      status: req.query.status,
    });
    const BookingsCount = result.length;
    res.json({ success: true, BookingsCount,...result });
  } catch (error) {
    next(error);
  }
};

module.exports = { unifiedBookings };
