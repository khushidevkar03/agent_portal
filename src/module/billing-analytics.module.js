const db = require("../config/env");
const { getAprilToNowRange } = require("../config/reporting-period");

const money = (value) => Number(Number(value || 0).toFixed(2));

const billingSchemas = {
  taxi: { table: "bookings", date: "booking_date", invoiceTable: "invoice", taxCharge: "taxivaxi_tax_charge", extraCharge: "tax", assigned: "is_assign", childKey: "master_booking_id", cancelled: null },
  hotel: { table: "hotel_bookings", date: "booking_date", invoiceTable: "hotel_invoice", taxCharge: "taxivaxi_tax_charge", extraCharge: "tax_on_room", assigned: "is_assign", childKey: "master_booking_id", cancelled: "is_cancelled" },
  train: { table: "train_bookings", date: "booking_datetime", invoiceTable: "train_invoice", taxCharge: "taxivaxi_tax_charge", assigned: "is_assign", childKey: "master_booking_id", cancelled: "is_cancelled" },
  bus: { table: "bus_bookings", date: "booking_datetime", invoiceTable: "bus_invoice", taxCharge: "taxivaxi_tax_charge", assigned: "is_assign", childKey: "master_booking_id", cancelled: "is_cancelled" },
  flight: { table: "flight_bookings", date: "booking_datetime", invoiceTable: "flight_invoice", taxCharge: "taxivaxi_tax_charge", assigned: "is_assign", childKey: "master_booking_id", cancelled: "is_cancelled" },
};

const createBucket = () => ({ totalUnbilled: 0, totalBilled: 0, totalPaymentReceived: 0 });

const addToBucket = (bucket, row) => {
  const payable = Number(row.payableAmount || 0);
  bucket.totalUnbilled += row.billState === "unbilled" ? payable : 0;
  bucket.totalBilled += row.billState === "billed" ? payable : 0;
  bucket.totalPaymentReceived += Number(row.paymentReceived || 0);
};

const formatBuckets = (map) => Object.fromEntries(
  Object.entries(map).map(([key, value]) => [key, {
    totalUnbilled: money(value.totalUnbilled),
    totalBilled: money(value.totalBilled),
    totalPaymentReceived: money(value.totalPaymentReceived),
  }]),
);

const getBillingAnalytics = async ({ agentId, adminId, month }) => {
  const serviceRows = await Promise.all(Object.entries(billingSchemas).map(async ([service, schema]) => {
    const params = [agentId];
    const where = ["client.agent_id = ?", `b.${schema.assigned} = 1`, `(b.${schema.childKey} IS NULL OR b.${schema.childKey} = 0)`, `b.${schema.date} >= ?`, `b.${schema.date} < ?`];
    const range = getAprilToNowRange();
    params.push(range.start, range.end);
    if (adminId) {
      where.push("b.admin_id = ?");
      params.push(adminId);
    }
    if (month) {
      where.push(`DATE_FORMAT(b.${schema.date}, '%Y-%m') = ?`);
      params.push(month);
    }

    const [rows] = await db.query(
      `SELECT '${service}' AS service,
        b.admin_id AS clientId,
        client.corporate_name AS clientName,
        DATE_FORMAT(b.${schema.date}, '%Y-%m-%d') AS serviceDate,
        CASE
          WHEN inv.invoiceStatus IN (1, 2, 3, 6, 7, 9) THEN 'unbilled'
          WHEN inv.invoiceStatus IN (4, 5) THEN 'billed'
          ELSE 'ignored'
        END AS billState,
        ${schema.cancelled ? `CASE WHEN b.${schema.cancelled} = 0 THEN COALESCE(inv.invoiceAmount, 0) ELSE 0 END` : "COALESCE(inv.invoiceAmount, 0)"} AS payableAmount,
        CASE WHEN inv.invoiceStatus IN (4, 5)
          THEN COALESCE(bo.payment_amount_received, 0)
          ELSE 0 END AS paymentReceived,
        CAST(inv.invoiceStatus AS CHAR) AS invoiceStatus
       FROM ${schema.table} b
       INNER JOIN admins client ON client.id = b.admin_id
       INNER JOIN (
         SELECT booking_id,
           SUBSTRING_INDEX(GROUP_CONCAT(status ORDER BY id DESC SEPARATOR ','), ',', 1) AS invoiceStatus,
           SUBSTRING_INDEX(GROUP_CONCAT(COALESCE(bill_id, 0) ORDER BY id DESC SEPARATOR ','), ',', 1) AS bill_id,
           SUM(sub_total - COALESCE(${schema.taxCharge}, 0)${schema.extraCharge ? ` - COALESCE(${schema.extraCharge}, 0)` : ""}) AS invoiceAmount
         FROM ${schema.invoiceTable}
         WHERE (is_cancelled = 0 OR is_cancelled IS NULL)
           AND status IN (1, 2, 3, 4, 5, 6, 7, 9)
         GROUP BY booking_id
       ) inv ON inv.booking_id = b.id
       LEFT JOIN bills_offline bo ON bo.id = inv.bill_id AND bo.is_deleted = 0
       WHERE ${where.join(" AND ")}`,
      params,
    );
    return rows;
  }));

  const totals = createBucket();
  const clientWise = {};
  const serviceWise = {};
  const unbilledServiceWise = {};
  const billedServiceWise = {};
  const billedInvoiceStatusWise = {};
  const monthWise = {};
  const dateWise = {};

  for (const row of serviceRows.flat()) {
    addToBucket(totals, row);
    const clientKey = row.clientName || `Client ${row.clientId}`;
    const dateKey = row.serviceDate ? String(row.serviceDate).slice(0, 10) : "unknown";
    const monthKey = dateKey === "unknown" ? "unknown" : dateKey.slice(0, 7);
    for (const [map, key] of [
      [clientWise, clientKey],
      [serviceWise, row.service],
      [monthWise, monthKey],
      [dateWise, dateKey],
    ]) {
      if (!map[key]) map[key] = createBucket();
      addToBucket(map[key], row);
    }
    if (row.billState === "ignored") continue;
    const stateMap = row.billState === "unbilled" ? unbilledServiceWise : billedServiceWise;
    if (!stateMap[row.service]) stateMap[row.service] = createBucket();
    addToBucket(stateMap[row.service], row);
    if (row.billState === "billed") {
      if (!billedInvoiceStatusWise[row.invoiceStatus]) billedInvoiceStatusWise[row.invoiceStatus] = createBucket();
      addToBucket(billedInvoiceStatusWise[row.invoiceStatus], row);
    }
  }

  return {
    ...formatBuckets({ total: totals }).total,
    clientWise: formatBuckets(clientWise),
    serviceWise: formatBuckets(serviceWise),
    unbilled: {
      total: money(totals.totalUnbilled),
      serviceWise: formatBuckets(unbilledServiceWise),
    },
    billed: {
      total: money(totals.totalBilled),
      serviceWise: formatBuckets(billedServiceWise),
      invoiceStatusWise: formatBuckets(billedInvoiceStatusWise),
    },
    monthWise: formatBuckets(monthWise),
    dateWise: formatBuckets(dateWise),
  };
};

module.exports = { getBillingAnalytics };
