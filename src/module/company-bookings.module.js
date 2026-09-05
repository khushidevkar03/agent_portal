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

const getCompanyBookings = async ({ adminId, companyName, page = 1, limit = 50 }) => {
  const company = await getCompany({ adminId, companyName });
  if (!company) return { company: null, bookings: [] };

  const perServiceLimit = page * limit;
  const batches = await Promise.all(Object.entries(recentActivitySchema).map(async ([service, schema]) => {
    const invoiceJoin = schema.invoiceTable
      ? `LEFT JOIN (SELECT booking_id, SUM(${schema.amount}) AS finalAmount FROM ${schema.invoiceTable} GROUP BY booking_id) i ON i.booking_id = b.${schema.id}`
      : "";
    const finalAmount = schema.invoiceTable
      ? `CASE WHEN b.${schema.assigned} = 1${schema.cancelled ? ` AND b.${schema.cancelled} = 0` : ""} AND COALESCE(i.finalAmount, 0) > 0 THEN i.finalAmount ELSE 0 END`
      : schema.amount ? `COALESCE(b.${schema.amount}, 0)` : "0";
    const pickup = schema.pickup ? `b.${schema.pickup}` : "NULL";
    const drop = schema.drop ? `b.${schema.drop}` : "NULL";
    const location = schema.location ? `b.${schema.location}` : "NULL";
    const passenger = schema.passenger ? `b.${schema.passenger}` : "NULL";
    const params = [company.id];
    const where = ["b.admin_id = ?"];
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
       ORDER BY b.${schema.bookingDate} DESC
       LIMIT ?`,
      [...params, perServiceLimit],
    );
    const countParams = [company.id];
    const countWhere = ["b.admin_id = ?"];
    addAprilFilter(countWhere, countParams, schema.bookingDate);
    const [countRows] = await db.query(
      `SELECT COUNT(DISTINCT b.${schema.id}) AS total
       FROM ${schema.table} b WHERE ${countWhere.join(" AND ")}`,
      countParams,
    );
    return { rows, total: Number(countRows[0].total || 0) };
  }));

  const offset = (page - 1) * limit;
  const bookings = batches.flatMap((batch) => batch.rows)
    .sort((a, b) => new Date(b.booking_date || 0) - new Date(a.booking_date || 0))
    .slice(offset, offset + limit)
    .map((row) => ({ ...row, final_amount: Number(Number(row.final_amount || 0).toFixed(2)) }));
  return { company, bookings, totalBookings: batches.reduce((total, batch) => total + batch.total, 0) };
};

module.exports = { getCompanyBookings };
