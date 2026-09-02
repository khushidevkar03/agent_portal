const express = require("express");
const { recentActivity } = require("../controller/recent-activity.controller");

const router = express.Router();
router.get("/", recentActivity);

module.exports = router;
