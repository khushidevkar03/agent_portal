const express = require("express");
const { getBookings } = require("../controller/service-specific-bookings.controller");

const router = express.Router();
router.get("/bus-bookings", getBookings("bus"));
router.get("/train-bookings", getBookings("train"));
router.get("/flight-bookings", getBookings("flight"));
router.get("/hotel-bookings", getBookings("hotel"));
router.get("/visa-bookings", getBookings("visa"));

module.exports = router;
