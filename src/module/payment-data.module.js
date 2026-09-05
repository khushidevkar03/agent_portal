const db = require("../config/env");
const { getAprilToNowRange } = require("../config/reporting-period");

const getPaymentData = async (agentId) => {
  const range = getAprilToNowRange();
  const [rows] = await db.query(
    `SELECT
       b.id AS billId,
       b.admin_id AS clientId,
       client.corporate_name AS clientName,
       b.bill_reference_no AS billReferenceId,
       b.tax_invoice_id AS taxInvoiceId,
       b.bill_date AS billDate,
       b.payment_date AS paymentDate,
       CASE WHEN b.bill_date IS NULL OR b.payment_date IS NULL
         THEN NULL ELSE DATEDIFF(b.payment_date, b.bill_date) END AS paymentGapDays,
       b.services_billed AS serviceType,
       CASE WHEN COALESCE(b.payment_amount_received, 0) > 0
         THEN b.payment_receipt ELSE NULL END AS paymentReceipt,
       CASE WHEN COALESCE(b.payment_amount_received, 0) > 0
         THEN b.bill_voucher ELSE NULL END AS billVoucher,
       b.taxi_booking_ids AS taxiBookingIds,
       b.hotel_booking_ids AS hotelBookingIds,
       b.train_booking_ids AS trainBookingIds,
       b.bus_booking_ids AS busBookingIds,
       b.flight_booking_ids AS flightBookingIds,
       b.bill_amount AS billAmount,
       b.payable_amount AS payableAmount,
       b.payment_amount AS paymentAmount,
       b.payment_amount_received AS paymentAmountReceived,
       CASE WHEN COALESCE(b.payment_amount_received, 0) > 0 THEN 1 ELSE 0 END AS isPaid,
       b.payment_status AS paymentStatus,
       b.payment_mode AS paymentMode,
       b.payment_reference_no AS paymentReferenceNo,
       b.bill_type AS billType,
       b.billing_period AS billingPeriod,
       b.created AS createdAt
     FROM bills_offline b
     INNER JOIN admins client ON client.id = b.admin_id AND client.agent_id = ?
     WHERE b.is_deleted = 0
       AND b.bill_date >= ? AND b.bill_date < ?
     ORDER BY b.bill_date DESC, b.id DESC`,
    [agentId, range.start, range.end],
  );

  const clientWise = {};
  for (const row of rows) {
    const key = String(row.clientId);
    if (!clientWise[key]) {
      clientWise[key] = {
        clientId: row.clientId,
        clientName: row.clientName || `Client ${row.clientId}`,
        payments: [],
      };
    }
    clientWise[key].payments.push(row);
  }

  return {
    total: rows.length,
    clientWise: Object.values(clientWise),
  };
};

module.exports = { getPaymentData };
