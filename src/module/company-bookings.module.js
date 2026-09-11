const db = require("../config/env");
const { recentActivitySchema } = require("../config/recent-activity.schema");
const { addAprilFilter } = require("../config/reporting-period");

const getCompany = async ({ adminId, companyName }) => {
  if (adminId) {
    const [rows] = await db.query(
      "SELECT id, corporate_name AS companyName FROM admins WHERE id = ? LIMIT 1",
      [adminId],
    );
    return rows[0];
  }
  const [rows] = await db.query(
    "SELECT id, corporate_name AS companyName FROM admins WHERE LOWER(TRIM(corporate_name)) = LOWER(TRIM(?)) LIMIT 1",
    [companyName],
  );
  return rows[0];
};

const getCompanyBookings = async ({ adminId, companyName }) => {
  const company = await getCompany({ adminId, companyName });
  if (!company) return { company: null, bookings: [] };

  const batches = await Promise.all(Object.entries(recentActivitySchema).map(async ([service, schema]) => {
    const invoiceJoin = schema.invoiceTable
      ? `LEFT JOIN (
          SELECT booking_id,
            SUM(${schema.amount} - COALESCE(${schema.invoiceFees}, 0)${schema.invoiceExtraFees ? ` - COALESCE(${schema.invoiceExtraFees}, 0)` : ""}) AS finalAmount
          FROM ${schema.invoiceTable}
          WHERE (is_cancelled = 0 OR is_cancelled IS NULL)
          GROUP BY booking_id
        ) i ON i.booking_id = b.${schema.id}`
      : "";
    const finalAmount = schema.invoiceTable
      ? `CASE WHEN ${schema.cancelled ? `b.${schema.cancelled} = 0 AND ` : ""}b.${schema.assigned} = 1 AND COALESCE(i.finalAmount, 0) > 0 THEN i.finalAmount ELSE 0 END`
      : schema.amount ? `COALESCE(b.${schema.amount}, 0)` : "0";
    const invoiceFinalAmount = schema.invoiceTable
      ? `CASE WHEN ${schema.cancelled ? `b.${schema.cancelled} = 0 AND ` : ""}b.${schema.assigned} = 1 AND COALESCE(i.${schema.amount}, 0) > 0 THEN i.${schema.amount} - COALESCE(i.${schema.invoiceFees}, 0)${schema.invoiceExtraFees ? ` - COALESCE(i.${schema.invoiceExtraFees}, 0)` : ""} ELSE 0 END`
      : "0";
    const pickup = schema.pickup ? `b.${schema.pickup}` : "NULL";
    const drop = schema.drop ? `b.${schema.drop}` : "NULL";
    const location = schema.location ? `b.${schema.location}` : "NULL";
    const passenger = schema.passenger ? `b.${schema.passenger}` : "NULL";
    const params = [company.id];
    const where = ["b.admin_id = ?"];
    if (schema.invoiceTable) where.push(`b.${schema.assigned} = 1`, `(b.${schema.childKey} IS NULL OR b.${schema.childKey} = 0)`);
    addAprilFilter(where, params, schema.bookingDate);
    const [rows] = await db.query(
      `SELECT b.${schema.id} AS booking_id,
        COALESCE(b.${schema.reference}, b.${schema.id}) AS reference_no,
        '${schema.label}' AS tour_type,
        a.id AS client_id, a.corporate_name AS client_name,
        ${passenger} AS traveller_name,
        b.${schema.bookingDate} AS booking_date,
        b.${schema.travelDate} AS travel_date,
        ${pickup} AS pickup_location, ${drop} AS drop_location, ${location} AS location,
        b.${schema.status} AS booking_status,
       ${finalAmount} AS final_amount
       FROM ${schema.table} b
       INNER JOIN admins a ON a.id = b.admin_id
       ${invoiceJoin}
       WHERE ${where.join(" AND ")}
       ORDER BY b.${schema.bookingDate} DESC`,
      params,
    );
    let invoiceRows = [];
    if (schema.invoiceTable) {
      const invoiceParams = [company.id];
      const invoiceWhere = ["b.admin_id = ?", `b.${schema.assigned} = 1`, `(b.${schema.childKey} IS NULL OR b.${schema.childKey} = 0)`, "(i.is_cancelled = 0 OR i.is_cancelled IS NULL)"];
      addAprilFilter(invoiceWhere, invoiceParams, schema.bookingDate);
      const [invoiceData] = await db.query(
        `SELECT b.${schema.id} AS booking_id,
          i.id AS invoice_id,
          COALESCE(b.${schema.reference}, b.${schema.id}) AS reference_no,
          '${schema.label}' AS tour_type,
          a.id AS client_id, a.corporate_name AS client_name,
          ${passenger} AS traveller_name,
          b.${schema.bookingDate} AS booking_date,
          b.${schema.travelDate} AS travel_date,
          ${pickup} AS pickup_location, ${drop} AS drop_location, ${location} AS location,
          b.${schema.status} AS booking_status,
          ${schema.amount} AS invoice_sub_total,
          (COALESCE(i.${schema.invoiceFees}, 0)${schema.invoiceExtraFees ? ` + COALESCE(i.${schema.invoiceExtraFees}, 0)` : ""}) AS invoice_fees,
          ${invoiceFinalAmount} AS final_amount,
          'invoice' AS record_type
         FROM ${schema.table} b
         INNER JOIN admins a ON a.id = b.admin_id
         INNER JOIN ${schema.invoiceTable} i ON i.booking_id = b.${schema.id}
         WHERE ${invoiceWhere.join(" AND ")}
         ORDER BY b.${schema.bookingDate} DESC, i.id DESC`,
        invoiceParams,
      );
      invoiceRows = invoiceData;
    }
    return { rows: rows.map((row) => ({ ...row, record_type: "booking" })), invoiceRows };
  }));

  const bookings = batches.flatMap((batch) => [...batch.rows, ...batch.invoiceRows])
    .sort((a, b) => new Date(b.booking_date || 0) - new Date(a.booking_date || 0))
    .map((row) => ({ ...row, final_amount: Number(Number(row.final_amount || 0).toFixed(2)) }));
  return { company, bookings, totalBookings: bookings.length };
};

module.exports = { getCompanyBookings };
