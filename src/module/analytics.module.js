const db = require("../config/env");
const { dashboardSchema } = require("../config/dashboard.schema");

const number = (value) => Number(value || 0);
const money = (value) => Number(number(value).toFixed(2));

const getAnalytics = async (agentId) => {
  const [rows] = await db.query(
    "SELECT id, corporate_name AS clientName FROM admins WHERE agent_id = ?",
    [agentId],
  );
  const clientNames = Object.fromEntries(rows.map((row) => [row.id, row.clientName || `Client ${row.id}`]));
  const serviceRows = await Promise.all(Object.entries(dashboardSchema).map(async ([service, schema]) => {
    const invoiceJoin = schema.invoiceTable
      ? `LEFT JOIN (SELECT booking_id, SUM(${schema.invoiceAmount}) AS spend FROM ${schema.invoiceTable} GROUP BY booking_id) i ON i.booking_id = b.${schema.id}`
      : "";
    const spend = schema.invoiceTable && schema.isAssign
      ? `CASE WHEN b.${schema.isAssign} = 1 THEN COALESCE(i.spend, 0) ELSE 0 END`
      : "0";
    const [bookings] = await db.query(
      `SELECT '${service}' AS service, b.${schema.id} AS bookingId,
        b.${schema.bookedAt} AS bookingDate, b.${schema.status} AS bookingStatus,
        b.admin_id AS clientId, a.corporate_name AS clientName,
        ${spend} AS spend
       FROM ${schema.table} b
       INNER JOIN admins a ON a.id = b.admin_id AND a.agent_id = ?
       ${invoiceJoin}`,
      [agentId],
    );
    return bookings;
  }));

  const serviceWise = Object.fromEntries(
    Object.keys(dashboardSchema).map((service) => [service, { bookingCount: 0, spend: 0 }]),
  );
  const clientWise = {};
  const monthlyTrend = {};
  const bookingStatusDistribution = {};
  for (const booking of serviceRows.flat()) {
    const amount = number(booking.spend);
    const service = booking.service;
    const clientName = booking.clientName || clientNames[booking.clientId] || `Client ${booking.clientId}`;
    const status = booking.bookingStatus == null || booking.bookingStatus === "" ? "unknown" : String(booking.bookingStatus);
    const date = booking.bookingDate ? new Date(booking.bookingDate) : null;
    const month = date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 7) : "unknown";

    if (!serviceWise[service]) serviceWise[service] = { bookingCount: 0, spend: 0 };
    serviceWise[service].bookingCount += 1;
    serviceWise[service].spend += amount;

    if (!clientWise[clientName]) clientWise[clientName] = { bookingCount: 0, spend: 0 };
    clientWise[clientName].bookingCount += 1;
    clientWise[clientName].spend += amount;

    if (!monthlyTrend[month]) monthlyTrend[month] = { bookingCount: 0, spend: 0 };
    monthlyTrend[month].bookingCount += 1;
    monthlyTrend[month].spend += amount;

    if (!bookingStatusDistribution[status]) bookingStatusDistribution[status] = { bookingCount: 0, spend: 0 };
    bookingStatusDistribution[status].bookingCount += 1;
    bookingStatusDistribution[status].spend += amount;
  }

  const formatMetrics = (metrics) => Object.fromEntries(
    Object.entries(metrics).map(([key, value]) => [key, { bookingCount: value.bookingCount, spend: money(value.spend) }]),
  );
  const formattedClients = formatMetrics(clientWise);
  return {
    serviceWise: formatMetrics(serviceWise),
    clientWise: formattedClients,
    monthlyTrend: formatMetrics(monthlyTrend),
    topClientsBySpend: Object.entries(formattedClients)
      .map(([clientName, value]) => ({ clientName, ...value }))
      .sort((a, b) => b.spend - a.spend),
    bookingStatusDistribution: formatMetrics(bookingStatusDistribution),
  };
};

module.exports = { getAnalytics };
