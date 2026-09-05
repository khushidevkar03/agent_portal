const db = require("../config/env");
const { billingFields } = require("../config/billing.schema");
const { getAprilToNowRange } = require("../config/reporting-period");

const getBilling = async ({ agentId, type }) => {
  const range = getAprilToNowRange();
  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM bills_offline b
     INNER JOIN admins client ON client.id = b.admin_id AND client.agent_id = ?
     WHERE b.status = ? AND b.is_deleted = 0
       AND b.bill_date >= ? AND b.bill_date < ?`,
    [agentId, type, range.start, range.end],
  );
  const [rows] = await db.query(
    `SELECT ${billingFields}
     FROM bills_offline b
     INNER JOIN admins client ON client.id = b.admin_id AND client.agent_id = ?
     WHERE b.status = ? AND b.is_deleted = 0
       AND b.bill_date >= ? AND b.bill_date < ?
     ORDER BY b.created DESC, b.id DESC`,
    [agentId, type, range.start, range.end],
  );
  return { bills: rows, total: Number(countRows[0].total || 0) };
};

module.exports = { getBilling };
