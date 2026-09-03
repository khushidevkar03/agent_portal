const db = require("../config/env");

const getPaymentData = async (agentId) => {
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
       b.payment_receipt AS paymentReceipt,
       b.taxi_booking_ids AS taxiBookingIds,
       b.hotel_booking_ids AS hotelBookingIds,
       b.train_booking_ids AS trainBookingIds,
       b.bus_booking_ids AS busBookingIds,
       b.flight_booking_ids AS flightBookingIds,
       b.bill_amount AS billAmount,
       b.payable_amount AS payableAmount,
       b.payment_amount AS paymentAmount,
       b.payment_amount_received AS paymentAmountReceived,
       b.payment_status AS paymentStatus,
       b.payment_mode AS paymentMode,
       b.payment_reference_no AS paymentReferenceNo,
       b.bill_type AS billType,
       b.billing_period AS billingPeriod,
       b.created AS createdAt
     FROM bills_offline b
     INNER JOIN admins client ON client.id = b.admin_id AND client.agent_id = ?
     WHERE b.is_deleted = 0
     ORDER BY b.bill_date DESC, b.id DESC`,
    [agentId],
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
