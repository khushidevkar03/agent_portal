const db = require("../config/env");
const { unifiedBookingSchema } = require("../config/unified-booking.schema");
const { addAprilFilter } = require("../config/reporting-period");

const UNBILLED_INVOICE_STATUSES = new Set([1, 2, 3, 6, 7, 9]);
const BILLED_INVOICE_STATUSES = new Set([4, 5]);

const buildWhere = (schema, params, agentId, filters) => {
  const where = ["client.agent_id = ?"];
  params.push(agentId);
  if (schema.assigned) where.push(`b.${schema.assigned} = 1`);
  if (schema.childKey) where.push(`(b.${schema.childKey} IS NULL OR b.${schema.childKey} = 0)`);
  if (filters.clientIds && filters.clientIds.length) {
    where.push(`b.${schema.clientId} IN (${filters.clientIds.map(() => "?").join(",")})`);
    params.push(...filters.clientIds);
  }
  const dateColumn = filters.dateBasis === "travel_date" ? schema.travelDate : schema.bookingDate;
  addAprilFilter(where, params, dateColumn);
  if (filters.from) {
    where.push(`b.${dateColumn} >= ?`);
    params.push(filters.from);
  }
  if (filters.to) {
    where.push(`b.${dateColumn} < DATE_ADD(?, INTERVAL 1 DAY)`);
    params.push(filters.to);
  }
  if (filters.status) {
    where.push(`b.${schema.status} = ?`);
    params.push(filters.status);
  }
  if (filters.search) {
    const search = `%${filters.search}%`;
    where.push(`(CAST(b.${schema.id} AS CHAR) LIKE ? OR COALESCE(b.${schema.reference}, '') LIKE ? OR COALESCE(${schema.traveller ? `b.${schema.traveller}` : "''"}, '') LIKE ? OR COALESCE(client.corporate_name, '') LIKE ?)`);
    params.push(search, search, search, search);
  }
  return where;
};

const getServiceRows = async (service, schema, agentId, filters) => {
  const params = [];
  const where = buildWhere(schema, params, agentId, filters);
  const invoiceJoin = schema.invoiceTable
    ? `INNER JOIN (
         SELECT booking_id,
           SUM(${schema.invoiceAmount}) AS invoiceAmount,
           SUM(COALESCE(${schema.invoiceFees}, 0)${schema.invoiceExtraFees ? ` + COALESCE(${schema.invoiceExtraFees}, 0)` : ""}) AS taxiFees,
           SUBSTRING_INDEX(GROUP_CONCAT(${schema.invoiceStatus} ORDER BY id DESC SEPARATOR ','), ',', 1) AS invoiceStatus,
           SUBSTRING_INDEX(GROUP_CONCAT(COALESCE(is_paid, 0) ORDER BY id DESC SEPARATOR ','), ',', 1) AS isPaid
         FROM ${schema.invoiceTable}
         GROUP BY booking_id
       ) invoice ON invoice.booking_id = b.${schema.id}`
    : "";
  const traveller = schema.traveller ? `b.${schema.traveller}` : "NULL";
  const finalAmount = schema.invoiceTable
    ? `CASE WHEN b.${schema.assigned} = 1 AND COALESCE(invoice.invoiceAmount, 0) > 0 THEN invoice.invoiceAmount - COALESCE(invoice.taxiFees, 0) ELSE 0 END`
    : schema.bookingAmount ? `COALESCE(b.${schema.bookingAmount}, 0)` : "0";
  const invoiceStatus = schema.invoiceTable ? "invoice.invoiceStatus" : schema.invoiceStatus ? `b.${schema.invoiceStatus}` : "NULL";
  const [rows] = await db.query(
    `SELECT '${service}' AS service_type, '${schema.label}' AS service_label,
      b.${schema.id} AS booking_id,
      COALESCE(b.${schema.reference}, b.${schema.id}) AS booking_reference,
      b.${schema.clientId} AS client_id,
      client.corporate_name AS client_name,
      ${traveller} AS traveller_name,
      b.${schema.bookingDate} AS booking_date,
      b.${schema.travelDate} AS travel_date,
      ${schema.route} AS route_or_destination,
      b.${schema.status} AS booking_status,
      ${invoiceStatus} AS invoice_status,
      ${schema.invoiceTable ? "invoice.isPaid" : "NULL"} AS is_paid,
      ${schema.invoiceTable ? "invoice.invoiceAmount" : schema.bookingAmount ? `COALESCE(b.${schema.bookingAmount}, 0)` : "0"} AS sub_total,
      ${schema.invoiceTable ? "invoice.taxiFees" : "0"} AS taxi_fees,
      ${finalAmount} AS final_amount
     FROM ${schema.table} b
     INNER JOIN admins client ON client.id = b.${schema.clientId}
     ${invoiceJoin}
     WHERE ${where.join(" AND ")}
     ORDER BY b.${schema.bookingDate} DESC`,
    params,
  );
  return rows;
};

const getUnifiedBookings = async ({ agentId, service, from, to, status, dateBasis = "booking_date", clientIds, search }) => {
  const services = service ? { [service]: unifiedBookingSchema[service] } : unifiedBookingSchema;
  const batches = await Promise.all(Object.entries(services).map(([name, schema]) =>
    getServiceRows(name, schema, agentId, { from, to, status, dateBasis, clientIds, search })));
  const data = batches.flat()
    .sort((a, b) => new Date(b.booking_date || 0) - new Date(a.booking_date || 0))
    .map((row) => ({
      ...row,
      invoice_status: row.invoice_status == null ? null : Number(row.invoice_status),
      is_paid: row.is_paid == null ? null : Number(row.is_paid),
      amount: {
        sub_total: Number(Number(row.sub_total || 0).toFixed(2)),
        taxi_fees: Number(Number(row.taxi_fees || 0).toFixed(2)),
        total: Number((Number(row.sub_total || 0) - Number(row.taxi_fees || 0)).toFixed(2)),
      },
      final_amount: Number(Number(row.final_amount || 0).toFixed(2)),
    }));

  const unbilled = data.filter((row) => UNBILLED_INVOICE_STATUSES.has(row.invoice_status));
  const billed = data.filter((row) => BILLED_INVOICE_STATUSES.has(row.invoice_status));
  const paid = data.filter((row) => row.is_paid === 1);

  return {
    data,
    count: data.length,
    billing: {
      unbilled,
      billed,
      paid,
    },
  };
};

module.exports = { getUnifiedBookings };
