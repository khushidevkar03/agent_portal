const express = require("express");
const { paymentData } = require("../controller/payment-data.controller");

const router = express.Router();
router.post("/", paymentData);

module.exports = router;
