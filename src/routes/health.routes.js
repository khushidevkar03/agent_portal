const express = require('express');
const { getHealth } = require('../controller/health.controller');

const router = express.Router();

router.post('/', getHealth);

module.exports = router;
