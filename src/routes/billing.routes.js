const express = require("express");
const { billing } = require("../controller/billing.controller");

const router = express.Router();
router.post("/", billing);

module.exports = router;
