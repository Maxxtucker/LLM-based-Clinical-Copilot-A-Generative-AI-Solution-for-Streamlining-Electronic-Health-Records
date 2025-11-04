const express = require('express');
const { generateAIResponseEndpoint } = require('../controllers/ai.controller');

const router = express.Router();

// AI generation endpoint
router.post('/generate', generateAIResponseEndpoint);

module.exports = router;
