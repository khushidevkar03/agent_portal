const express = require("express");
const { analytics } = require("../controller/analytics.controller");

const router = express.Router();
router.get("/", analytics);

module.exports = router;
