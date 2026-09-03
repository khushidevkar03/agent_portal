const { getUnifiedBookings } = require("../module/unified-booking.module");
const { unifiedBookingSchema } = require("../config/unified-booking.schema");

const unifiedBookings = async (req, res, next) => {
  try {
    const agentId = Number.parseInt(req.body.agent_id, 10);
    const service = req.body.service
      ? String(req.body.service).toLowerCase()
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
      from: req.body.from,
      to: req.body.to,
      status: req.body.status,
    });
    const BookingsCount = result.length;
    res.json({ success: true, BookingsCount,...result });
  } catch (error) {
    next(error);
  }
};

module.exports = { unifiedBookings };
