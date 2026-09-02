const express = require("express");
const { unifiedBookings } = require("../controller/unified-booking.controller");

const router = express.Router();
router.get("/", unifiedBookings);

module.exports = router;
