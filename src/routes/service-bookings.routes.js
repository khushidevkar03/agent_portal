const express = require("express");
const { serviceBookings } = require("../controller/service-bookings.controller");

const router = express.Router();
router.get("/", serviceBookings);

module.exports = router;
