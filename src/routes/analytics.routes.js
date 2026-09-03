const express = require("express");
const { analytics } = require("../controller/analytics.controller");

const router = express.Router();
router.post("/", analytics);

module.exports = router;
