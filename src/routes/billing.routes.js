const express = require("express");
const { billing } = require("../controller/billing.controller");

const router = express.Router();
router.get("/", billing);

module.exports = router;
