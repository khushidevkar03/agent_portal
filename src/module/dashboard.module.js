const db = require("../config/env");
const { dashboardSchema } = require("../config/dashboard.schema");
const { getAnalytics } = require("./analytics.module");

const toNumber = (value) => Number(value || 0);
const money = (value) => Number(toNumber(value).toFixed(2));

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const format = (value) => value.toISOString().slice(0, 19).replace("T", " ");
  return { start: format(start), end: format(end) };
};

const getServiceSummary = async (agentId, schema, month) => {
  const invoiceJoin = schema.invoiceTable
    ? `LEFT JOIN (SELECT booking_id, SUM(${schema.invoiceAmount}) AS spend FROM ${schema.invoiceTable} GROUP BY booking_id) i ON i.booking_id = b.${schema.id}`
    : "";
  const spendExpression = schema.invoiceTable && schema.isAssign
    ? `CASE WHEN b.${schema.isAssign} = 1 THEN COALESCE(i.spend, 0) ELSE 0 END`
    : "0";
  const confirmedExpression = schema.isAssign
    ? `SUM(CASE WHEN b.${schema.isAssign} = 1 THEN 1 ELSE 0 END)`
    : "0";
  const cancelledExpression = schema.isCancelled
    ? `SUM(CASE WHEN b.${schema.isCancelled} = 1 THEN 1 ELSE 0 END)`
    : "0";

  const [rows] = await db.query(
    `SELECT COUNT(DISTINCT b.${schema.id}) AS totalBookings,
      COALESCE(SUM(${spendExpression}), 0) AS totalSpend,
      ${confirmedExpression} AS confirmedBookings,
      ${cancelledExpression} AS cancelledBookings,
      COUNT(DISTINCT CASE WHEN b.${schema.bookedAt} >= ? AND b.${schema.bookedAt} < ? THEN b.${schema.id} END) AS currentMonthBookings,
      COALESCE(SUM(CASE WHEN b.${schema.bookedAt} >= ? AND b.${schema.bookedAt} < ? THEN ${spendExpression} ELSE 0 END), 0) AS currentMonthSpend
    FROM ${schema.table} b
    INNER JOIN admins client ON client.id = b.admin_id
      AND client.agent_id = ?
    ${invoiceJoin}`,
    [month.start, month.end, month.start, month.end, agentId],
  );
  return rows[0] || {};
};

const getDashboard = async (agentId) => {
  const [clients] = await db.query(
    "SELECT id, corporate_name AS clientName, is_active AS isActive FROM admins WHERE agent_id = ?",
    [agentId],
  );
  const month = getCurrentMonthRange();
  const serviceRows = await Promise.all(
    Object.entries(dashboardSchema).map(async ([service, schema]) => [
      service,
      await getServiceSummary(agentId, schema, month),
    ]),
  );
  const data = {
    totalReferredClients: clients.length,
    referredClients: clients.map((client) => ({
      adminId: client.id,
      clientName: client.clientName || `Client ${client.id}`,
    })),
    activeReferredClients: clients.filter((client) => Number(client.isActive) === 1).length,
    totalBookings: 0,
    totalSpend: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    currentMonthBookings: 0,
    currentMonthSpend: 0,
  };
  data.serviceWise = serviceRows.map(([service, row]) => ({
    service,
    bookingCount: toNumber(row.totalBookings),
    spend: money(row.totalSpend),
  }));
  const analytics = await getAnalytics(agentId);
  data.clientWise = analytics.clientWise;
  data.monthWise = analytics.monthlyTrend;
  data.billing = analytics.billing;
  for (const [, row] of serviceRows) {
    data.totalBookings += toNumber(row.totalBookings);
    data.totalSpend += toNumber(row.totalSpend);
    data.confirmedBookings += toNumber(row.confirmedBookings);
    data.cancelledBookings += toNumber(row.cancelledBookings);
    data.currentMonthBookings += toNumber(row.currentMonthBookings);
    data.currentMonthSpend += toNumber(row.currentMonthSpend);
  }
  data.totalSpend = money(data.totalSpend);
  data.currentMonthSpend = money(data.currentMonthSpend);
  return data;
};

module.exports = { getDashboard };
