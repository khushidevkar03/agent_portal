const db = require("../config/env");
const { recentActivitySchema } = require("../config/recent-activity.schema");

const getRecentActivity = async (agentId, limit) => {
  const queries = Object.entries(recentActivitySchema).map(async ([service, schema]) => {
    const invoiceJoin = schema.invoiceTable
      ? `LEFT JOIN (SELECT booking_id, SUM(${schema.amount}) AS finalAmount FROM ${schema.invoiceTable} GROUP BY booking_id) i ON i.booking_id = b.${schema.id}`
      : "";
    const finalAmount = schema.invoiceTable && schema.assigned
      ? `CASE WHEN b.${schema.assigned} = 1 THEN COALESCE(i.finalAmount, 0) ELSE 0 END`
      : schema.invoiceTable
        ? "0"
        : `COALESCE(b.${schema.amount}, 0)`;
    const pickup = schema.pickup ? `b.${schema.pickup}` : "NULL";
    const drop = schema.drop ? `b.${schema.drop}` : "NULL";
    const location = schema.location ? `b.${schema.location}` : "NULL";
    const passenger = schema.passenger ? `b.${schema.passenger}` : "NULL";
    const [rows] = await db.query(
      `SELECT b.${schema.id} AS booking_id,
        b.${schema.reference} AS reference_no,
        '${schema.label}' AS tour_type,
        a.corporate_name AS client_name,
        ${passenger} AS traveller_name,
        b.${schema.bookingDate} AS booking_date,
        b.${schema.travelDate} AS travel_date,
        ${pickup} AS pickup_location,
        ${drop} AS drop_location,
        ${location} AS location,
        b.${schema.status} AS status,
        ${finalAmount} AS final_amount
       FROM ${schema.table} b
       INNER JOIN admins a ON a.id = b.admin_id AND a.agent_id = ?
       ${invoiceJoin}
       ORDER BY b.${schema.bookingDate} DESC
       LIMIT ?`,
      [agentId, limit],
    );
    return rows;
  });
  const bookings = (await Promise.all(queries)).flat();
  return bookings
    .sort((a, b) => new Date(b.booking_date || 0) - new Date(a.booking_date || 0))
    .slice(0, limit)
    .map((booking) => ({
      ...booking,
      final_amount: Number(Number(booking.final_amount || 0).toFixed(2)),
    }));
};

module.exports = { getRecentActivity };
