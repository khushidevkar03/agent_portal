const express = require("express");
const { filteredReport } = require("../controller/filtered-report.controller");

const router = express.Router();
router.get("/", filteredReport);

module.exports = router;
