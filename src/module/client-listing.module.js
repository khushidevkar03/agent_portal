const db = require("../config/env");
const { clientListingSchema } = require("../config/client-listing.schema");
const { addAprilFilter } = require("../config/reporting-period");

const money = (value) => Number(Number(value || 0).toFixed(2));

const getClientListing = async (agentId) => {
  const [clients] = await db.query(
    `SELECT id, corporate_name AS clientName, corporate_code AS clientCode,
      contact_name AS contactPerson, email, contact_no AS phone,
      is_active AS isActive, is_deleted AS isDeleted, NULL AS mappedDate
     FROM admins WHERE agent_id = ? ORDER BY corporate_name`,
    [agentId],
  );
  if (!clients.length) return [];

  const ids = clients.map((client) => client.id);
  const placeholders = ids.map(() => "?").join(",");
  const serviceResults = await Promise.all(Object.entries(clientListingSchema).map(async ([service, schema]) => {
    const invoiceJoin = schema.invoiceTable
      ? `LEFT JOIN (
          SELECT booking_id,
            SUM(${schema.invoiceAmount} - COALESCE(${schema.invoiceFees}, 0)${schema.invoiceExtraFees ? ` - COALESCE(${schema.invoiceExtraFees}, 0)` : ""}) AS spend,
            COUNT(*) AS invoiceCount
          FROM ${schema.invoiceTable}
          WHERE (is_cancelled = 0 OR is_cancelled IS NULL)
            AND status IN (1, 2, 3, 4, 5, 6, 7, 9)
          GROUP BY booking_id
        ) i ON i.booking_id = b.${schema.id}`
      : "";
    const spend = schema.invoiceTable
      ? `CASE WHEN ${schema.cancelled ? `b.${schema.cancelled} = 0 AND ` : ""}COALESCE(i.spend, 0) > 0 THEN COALESCE(i.spend, 0) ELSE 0 END`
      : "0";
    const params = [...ids];
    const where = [`b.admin_id IN (${placeholders})`];
    if (schema.invoiceTable) {
      where.push(`b.${schema.assigned} = 1`, `(b.${schema.childKey} IS NULL OR b.${schema.childKey} = 0)`);
    }
    addAprilFilter(where, params, schema.bookedAt);
    const [rows] = await db.query(
      `SELECT b.admin_id AS adminId,
        ${schema.invoiceTable ? `COUNT(DISTINCT b.${schema.id}) + COALESCE(SUM(i.invoiceCount), 0)` : `COUNT(DISTINCT b.${schema.id})`} AS bookingCount,
        COALESCE(SUM(${spend}), 0) AS spend, MAX(b.${schema.bookedAt}) AS lastBookingDate
       FROM ${schema.table} b ${invoiceJoin}
       WHERE ${where.join(" AND ")}
       GROUP BY b.admin_id`,
      params,
    );
    return [service, rows];
  }));

  const byClient = new Map(clients.map((client) => [client.id, {
    totalBookings: 0,
    totalSpend: 0,
    lastBookingDate: null,
    serviceWise: {},
  }]));
  for (const [service, rows] of serviceResults) {
    for (const row of rows) {
      const item = byClient.get(row.adminId);
      if (!item) continue;
      const count = Number(row.bookingCount || 0);
      const spend = Number(row.spend || 0);
      item.totalBookings += count;
      item.totalSpend += spend;
      if (row.lastBookingDate && (!item.lastBookingDate || new Date(row.lastBookingDate) > new Date(item.lastBookingDate))) {
        item.lastBookingDate = row.lastBookingDate;
      }
      item.serviceWise[service] = { bookingCount: count, spend: money(spend) };
    }
  }

  return clients.map((client) => {
    const metrics = byClient.get(client.id);
    for (const service of Object.keys(clientListingSchema)) {
      if (!metrics.serviceWise[service]) metrics.serviceWise[service] = { bookingCount: 0, spend: 0 };
    }
    return {
      clientName: client.clientName || `Client ${client.id}`,
      clientCode: client.clientCode,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone,
      mappedDate: client.mappedDate,
      accountStatus: Number(client.isDeleted) === 1 ? "deleted" : Number(client.isActive) === 1 ? "active" : "inactive",
      bookingCount: metrics.totalBookings,
      totalBookings: metrics.totalBookings,
      totalSpend: money(metrics.totalSpend),
      lastBookingDate: metrics.lastBookingDate,
      serviceWise: metrics.serviceWise,
    };
  });
};

module.exports = { getClientListing };
