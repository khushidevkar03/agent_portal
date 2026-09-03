const express = require("express");
const { filteredReport } = require("../controller/filtered-report.controller");

const router = express.Router();
router.post("/", filteredReport);

module.exports = router;
