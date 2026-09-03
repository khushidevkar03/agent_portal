const express = require("express");
const { companyBookings } = require("../controller/company-bookings.controller");

const router = express.Router();
router.post("/", companyBookings);

module.exports = router;
