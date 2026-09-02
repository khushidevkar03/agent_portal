// Explicit registry for the dashboard queries. Request input never supplies SQL identifiers.
const dashboardSchema = {
  taxi: {
    table: "bookings", id: "id", bookedAt: "booking_date", travelAt: "pickup_datetime",
    status: "status", invoiceTable: "invoice", invoiceAmount: "sub_total", isAssign: "is_assign", isCancelled: null,
  },
  bus: {
    table: "bus_bookings", id: "id", bookedAt: "booking_datetime", travelAt: "date_of_journey",
    status: "status_spoc", invoiceTable: "bus_invoice", invoiceAmount: "sub_total", isAssign: "is_assign", isCancelled: "is_cancelled",
  },
  train: {
    table: "train_bookings", id: "id", bookedAt: "booking_datetime", travelAt: "date_of_journey",
    status: "booking_status", invoiceTable: "train_invoice", invoiceAmount: "sub_total", isAssign: "is_assign", isCancelled: "is_cancelled",
  },
  flight: {
    table: "flight_bookings", id: "id", bookedAt: "booking_datetime", travelAt: "departure_date",
    status: "status", invoiceTable: "flight_invoice", invoiceAmount: "sub_total", isAssign: "is_assign", isCancelled: "is_cancelled",
  },
  hotel: {
    table: "hotel_bookings", id: "id", bookedAt: "booking_date", travelAt: "arrival_datetime",
    status: "status", invoiceTable: "hotel_invoice", invoiceAmount: "sub_total", isAssign: "is_assign", isCancelled: "is_cancelled",
  },
  visa: {
    table: "visa_bookings", id: "id", bookedAt: "booking_datetime", travelAt: "booking_datetime",
    status: "status", invoiceTable: null, invoiceAmount: null, isAssign: null, isCancelled: null, bookingAmount: "total_payable",
  },
};

module.exports = { dashboardSchema };
