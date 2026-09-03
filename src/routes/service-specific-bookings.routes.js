const express = require("express");
const { getBookings } = require("../controller/service-specific-bookings.controller");

const router = express.Router();
router.post("/bus-bookings", getBookings("bus"));
router.post("/train-bookings", getBookings("train"));
router.post("/flight-bookings", getBookings("flight"));
router.post("/hotel-bookings", getBookings("hotel"));
router.post("/visa-bookings", getBookings("visa"));

module.exports = router;
