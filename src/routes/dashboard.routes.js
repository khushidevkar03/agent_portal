const express = require("express");
const { dashboard } = require("../controller/dashboard.controller");

const router = express.Router();
router.get("/", dashboard);

module.exports = router;
