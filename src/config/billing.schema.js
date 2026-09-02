// bills_offline response mapping. The request `type` maps to bills_offline.bill_type.
const billingFields = `
  b.tax_invoice_id, b.payment_date, b.payment_status, b.id,
  b.basic_value, b.management_fees, b.reimbursement_amount, b.total_tax AS gst,
  b.extras, b.bill_amount, b.status, b.created, b.bill_date, b.admin_id,
  b.bill_reference_no, b.bill_data, b.bill_copy, b.billing_period,
  b.taxivaxi_billing_entity, b.services_billed, b.bill_type,
  client.corporate_name, client.billing_name AS entity_name, client.gst_id,
  b.total_tax, b.bill_voucher, b.payment_receipt,
  NULL AS client_verified_at, b.approver_id, NULL AS client_verified_by,
  b.verified_at AS taxivaxi_verified_at, b.verified_by AS taxivaxi_verified_by,
  'NA' AS booking_id, b.bill_type AS type`;

module.exports = { billingFields };
