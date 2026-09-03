const express = require("express");
const { unifiedBookings } = require("../controller/unified-booking.controller");

const router = express.Router();
router.post("/", unifiedBookings);

module.exports = router;
