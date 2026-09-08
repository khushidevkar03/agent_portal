const express = require('express');
const { signIn, referClient } = require('../controller/agent.controller');
const { authenticateAgent } = require('../middleware/agent-auth.middleware');

const router = express.Router();
router.post('/login', signIn);
router.post('/clients/agent', authenticateAgent, referClient);
module.exports = router;
