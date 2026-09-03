const {
  getPeriod,
  getFilteredReport,
} = require("../module/filtered-report.module");
const { unifiedBookingSchema } = require("../config/unified-booking.schema");

const filteredReport = async (req, res, next) => {
  try {
    const agentId = Number.parseInt(req.body.agent_id, 10);
    const period = String(req.body.period || "all").toLowerCase();
    const dateBasis = String(
      req.body.date_basis || "booking_date",
    ).toLowerCase();
    const service = req.body.service
      ? String(req.body.service).toLowerCase()
      : undefined;
    const clientIds = req.body.client_ids
      ? String(req.body.client_ids)
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
    const range = getPeriod(period, req.body.from, req.body.to);
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
      status: req.body.status,
      search: req.body.search,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { filteredReport };
