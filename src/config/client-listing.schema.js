const clientListingSchema = {
  taxi: { table: "bookings", id: "id", bookedAt: "pickup_datetime", invoiceTable: "invoice", invoiceAmount: "sub_total", taxExFees: "total_ex_tax", assigned: "is_assign" },
  bus: { table: "bus_bookings", id: "id", bookedAt: "booking_datetime", invoiceTable: "bus_invoice", invoiceAmount: "sub_total", taxExFees: "total_ex_tax", assigned: "is_assign" },
  train: { table: "train_bookings", id: "id", bookedAt: "booking_datetime", invoiceTable: "train_invoice", invoiceAmount: "sub_total", taxExFees: "total_ex_tax", assigned: "is_assign" },
  flight: { table: "flight_bookings", id: "id", bookedAt: "booking_datetime", invoiceTable: "flight_invoice", invoiceAmount: "sub_total", taxExFees: "total_ex_tax_fees", assigned: "is_assign" },
  hotel: { table: "hotel_bookings", id: "id", bookedAt: "arrival_datetime", invoiceTable: "hotel_invoice", invoiceAmount: "sub_total", taxExFees: "total_ex_tax", assigned: "is_assign" },
  visa: { table: "visa_bookings", id: "id", bookedAt: "booking_datetime", invoiceTable: null, invoiceAmount: null, assigned: null },
};

module.exports = { clientListingSchema };
