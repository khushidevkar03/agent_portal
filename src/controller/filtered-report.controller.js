const {
  getPeriod,
  getFilteredReport,
} = require("../module/filtered-report.module");
const { unifiedBookingSchema } = require("../config/unified-booking.schema");

const filteredReport = async (req, res, next) => {
  try {
    const agentId = Number.parseInt(req.query.agent_id, 10);
    const period = String(req.query.period || "all").toLowerCase();
    const dateBasis = String(
      req.query.date_basis || "booking_date",
    ).toLowerCase();
    const service = req.query.service
      ? String(req.query.service).toLowerCase()
      : undefined;
    const clientIds = req.query.client_ids
      ? String(req.query.client_ids)
          .split(",")
          .map((id) => Number.parseInt(id.trim(), 10))
          .filter((id) => Number.isInteger(id) && id > 0)
      : undefined;
    if (!Number.isInteger(agentId) || agentId <= 0)
      return res
        .status(400)
        .json({ success: false, message: "A valid agent_id is required" });
    if (!["booking_date", "travel_date"].includes(dateBasis))
      return res
        .status(400)
        .json({
          success: false,
          message: "date_basis must be booking_date or travel_date",
        });
    if (service && !unifiedBookingSchema[service])
      return res
        .status(400)
        .json({ success: false, message: "Unsupported service" });
    const range = getPeriod(period, req.query.from, req.query.to);
    if (range.error)
      return res.status(400).json({ success: false, message: range.error });
    const data = await getFilteredReport({
      agentId,
      service,
      clientIds,
      dateBasis,
      period,
      from: range.from,
      to: range.to,
      status: req.query.status,
      search: req.query.search,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { filteredReport };
