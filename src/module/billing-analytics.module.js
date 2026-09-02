const db = require("../config/env");

const money = (value) => Number(Number(value || 0).toFixed(2));

const getBillingAnalytics = async ({ agentId, adminId, month }) => {
  const params = [agentId];
  const where = ["client.agent_id = ?", "b.is_deleted = 0"];
  if (adminId) {
    where.push("b.admin_id = ?");
    params.push(adminId);
  }
  if (month) {
    where.push("DATE_FORMAT(COALESCE(b.bill_date, b.created), '%Y-%m') = ?");
    params.push(month);
  }
  const [rows] = await db.query(
    `SELECT b.admin_id AS clientId, client.corporate_name AS clientName,
      DATE_FORMAT(COALESCE(b.bill_date, b.created), '%Y-%m') AS month,
      CASE WHEN b.status = 0 THEN 'unbilled' ELSE 'billed' END AS billState,
      COALESCE(b.payable_amount, 0) AS payableAmount,
      COALESCE(b.payment_amount_received, 0) AS paymentReceived
     FROM bills_offline b
     INNER JOIN admins client ON client.id = b.admin_id
     WHERE ${where.join(" AND ")}`,
    params,
  );

  const totals = { totalUnbilled: 0, totalBilled: 0, totalPaymentReceived: 0 };
  const clientWise = {};
  const monthWise = {};
  for (const row of rows) {
    const payable = Number(row.payableAmount || 0);
    const received = Number(row.paymentReceived || 0);
    const unbilled = row.billState === "unbilled" ? payable : 0;
    const billed = row.billState === "billed" ? payable : 0;
    totals.totalUnbilled += unbilled;
    totals.totalBilled += billed;
    totals.totalPaymentReceived += received;
    const keys = [[clientWise, row.clientName || `Client ${row.clientId}`], [monthWise, row.month || "unknown"]];
    for (const [map, key] of keys) {
      if (!map[key]) map[key] = { totalUnbilled: 0, totalBilled: 0, totalPaymentReceived: 0 };
      map[key].totalUnbilled += unbilled;
      map[key].totalBilled += billed;
      map[key].totalPaymentReceived += received;
    }
  }
  const format = (map) => Object.fromEntries(Object.entries(map).map(([key, value]) => [key, {
    totalUnbilled: money(value.totalUnbilled),
    totalBilled: money(value.totalBilled),
    totalPaymentReceived: money(value.totalPaymentReceived),
  }]));
  return {
    totalUnbilled: money(totals.totalUnbilled),
    totalBilled: money(totals.totalBilled),
    totalPaymentReceived: money(totals.totalPaymentReceived),
    clientWise: format(clientWise),
    monthWise: format(monthWise),
  };
};

module.exports = { getBillingAnalytics };
