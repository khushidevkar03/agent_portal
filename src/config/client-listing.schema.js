const clientListingSchema = {
  taxi: { table: "bookings", id: "id", bookedAt: "booking_date", invoiceTable: "invoice", invoiceAmount: "sub_total", invoiceFees: "taxivaxi_tax_charge", invoiceExtraFees: "tax", assigned: "is_assign", childKey: "master_booking_id", cancelled: null },
  bus: { table: "bus_bookings", id: "id", bookedAt: "booking_datetime", invoiceTable: "bus_invoice", invoiceAmount: "sub_total", invoiceFees: "taxivaxi_tax_charge", assigned: "is_assign", childKey: "master_booking_id", cancelled: "is_cancelled" },
  train: { table: "train_bookings", id: "id", bookedAt: "booking_datetime", invoiceTable: "train_invoice", invoiceAmount: "sub_total", invoiceFees: "taxivaxi_tax_charge", assigned: "is_assign", childKey: "master_booking_id", cancelled: "is_cancelled" },
  flight: { table: "flight_bookings", id: "id", bookedAt: "booking_datetime", invoiceTable: "flight_invoice", invoiceAmount: "sub_total", invoiceFees: "taxivaxi_tax_charge", assigned: "is_assign", childKey: "master_booking_id", cancelled: "is_cancelled" },
  hotel: { table: "hotel_bookings", id: "id", bookedAt: "booking_date", invoiceTable: "hotel_invoice", invoiceAmount: "sub_total", invoiceFees: "taxivaxi_tax_charge", invoiceExtraFees: "tax_on_room", assigned: "is_assign", childKey: "master_booking_id", cancelled: "is_cancelled" },
  visa: { table: "visa_bookings", id: "id", bookedAt: "booking_datetime", invoiceTable: null, invoiceAmount: null, assigned: null },
};

module.exports = { clientListingSchema };
