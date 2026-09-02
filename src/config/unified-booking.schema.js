// Service-specific mappings for the normalized booking report.
// Spend rule: only assigned bookings with a positive invoice sub_total are counted.
// Cancelled bookings are excluded from spend where the table exposes is_cancelled.
// All booking statuses remain raw because each service uses different status values.
const unifiedBookingSchema = {
  taxi: {
    label: "Taxi", table: "bookings", id: "id", reference: "reference_no",
    clientId: "admin_id", bookingDate: "booking_date", travelDate: "pickup_datetime",
    route: "CONCAT_WS(' - ', CONVERT(b.pickup_location USING utf8mb4), CONVERT(b.drop_city_name USING utf8mb4))", traveller: "passenger_details",
    status: "status", invoiceTable: "invoice", invoiceAmount: "sub_total", invoiceStatus: "status",
    assigned: "is_assign", cancelled: null, childKey: "master_booking_id",
  },
  bus: {
    label: "Bus", table: "bus_bookings", id: "id", reference: "reference_no",
    clientId: "admin_id", bookingDate: "booking_datetime", travelDate: "date_of_journey",
    route: "CONCAT_WS(' - ', CONVERT(b.pickup_city USING utf8mb4), CONVERT(b.drop_city USING utf8mb4))", traveller: null,
    status: "status_spoc", invoiceTable: "bus_invoice", invoiceAmount: "sub_total", invoiceStatus: "status",
    assigned: "is_assign", cancelled: "is_cancelled", childKey: "master_booking_id",
  },
  train: {
    label: "Train", table: "train_bookings", id: "id", reference: "reference_no",
    clientId: "admin_id", bookingDate: "booking_datetime", travelDate: "date_of_journey",
    route: "CONCAT_WS(' - ', CONVERT(b.from_city USING utf8mb4), CONVERT(b.to_city USING utf8mb4))", traveller: null,
    status: "booking_status", invoiceTable: "train_invoice", invoiceAmount: "sub_total", invoiceStatus: "status",
    assigned: "is_assign", cancelled: "is_cancelled", childKey: "master_booking_id",
  },
  flight: {
    label: "Flight", table: "flight_bookings", id: "id", reference: "reference_no",
    clientId: "admin_id", bookingDate: "booking_datetime", travelDate: "departure_date",
    route: "CONCAT_WS(' - ', CONVERT(b.from_city USING utf8mb4), CONVERT(b.to_city USING utf8mb4))", traveller: "passenger_details",
    status: "status", invoiceTable: "flight_invoice", invoiceAmount: "sub_total", invoiceStatus: "status",
    assigned: "is_assign", cancelled: "is_cancelled", childKey: "master_booking_id",
  },
  hotel: {
    label: "Hotel", table: "hotel_bookings", id: "id", reference: "reference_no",
    clientId: "admin_id", bookingDate: "booking_date", travelDate: "arrival_datetime",
    route: "b.city", traveller: "passenger_details", status: "status",
    invoiceTable: "hotel_invoice", invoiceAmount: "sub_total", invoiceStatus: "status", assigned: "is_assign",
    cancelled: "is_cancelled", childKey: "master_booking_id",
  },
  visa: {
    label: "Visa", table: "visa_bookings", id: "id", reference: "reference_no",
    clientId: "admin_id", bookingDate: "booking_datetime", travelDate: "booking_datetime",
    route: "b.visa_country", traveller: null, status: "status", invoiceTable: null,
    invoiceAmount: null, invoiceStatus: "invoice_status", assigned: null, cancelled: null, childKey: null,
    bookingAmount: "total_payable",
  },
};

module.exports = { unifiedBookingSchema };
