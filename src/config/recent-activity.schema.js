const recentActivitySchema = {
  taxi: {
    label: "Taxi", table: "bookings", id: "id", reference: "reference_no",
    bookingDate: "booking_date", travelDate: "pickup_datetime", pickup: "pickup_location",
    drop: "drop_city_name", location: null, passenger: "passenger_details", status: "status",
    invoiceTable: "invoice", amount: "sub_total", assigned: "is_assign",
  },
  bus: {
    label: "Bus", table: "bus_bookings", id: "id", reference: "reference_no",
    bookingDate: "booking_datetime", travelDate: "date_of_journey", pickup: "pickup_city",
    drop: "drop_city", location: null, passenger: null, status: "status_spoc",
    invoiceTable: "bus_invoice", amount: "sub_total", assigned: "is_assign",
  },
  train: {
    label: "Train", table: "train_bookings", id: "id", reference: "reference_no",
    bookingDate: "booking_datetime", travelDate: "date_of_journey", pickup: "from_city",
    drop: "to_city", location: null, passenger: null, status: "booking_status",
    invoiceTable: "train_invoice", amount: "sub_total", assigned: "is_assign",
  },
  flight: {
    label: "Flight", table: "flight_bookings", id: "id", reference: "reference_no",
    bookingDate: "booking_datetime", travelDate: "departure_date", pickup: "from_city",
    drop: "to_city", location: null, passenger: "passenger_details", status: "status",
    invoiceTable: "flight_invoice", amount: "sub_total", assigned: "is_assign",
  },
  hotel: {
    label: "Hotel", table: "hotel_bookings", id: "id", reference: "reference_no",
    bookingDate: "booking_date", travelDate: "arrival_datetime", pickup: null,
    drop: null, location: "city", passenger: "passenger_details", status: "status",
    invoiceTable: "hotel_invoice", amount: "sub_total", assigned: "is_assign",
  },
  visa: {
    label: "Visa", table: "visa_bookings", id: "id", reference: "reference_no",
    bookingDate: "booking_datetime", travelDate: "booking_datetime", pickup: null,
    drop: null, location: "visa_country", passenger: null, status: "status",
    invoiceTable: null, amount: "total_payable", assigned: null,
  },
};

module.exports = { recentActivitySchema };
