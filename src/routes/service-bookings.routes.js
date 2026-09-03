const express = require("express");
const { serviceBookings } = require("../controller/service-bookings.controller");

const router = express.Router();
router.post("/", serviceBookings);

module.exports = router;
