const express = require("express");
const { recentActivity } = require("../controller/recent-activity.controller");

const router = express.Router();
router.post("/", recentActivity);

module.exports = router;
