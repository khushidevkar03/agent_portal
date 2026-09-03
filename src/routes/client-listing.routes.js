const express = require("express");
const { clientListing } = require("../controller/client-listing.controller");

const router = express.Router();
router.post("/", clientListing);

module.exports = router;
