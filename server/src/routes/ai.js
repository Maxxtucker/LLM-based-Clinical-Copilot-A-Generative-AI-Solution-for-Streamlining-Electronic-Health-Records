const express = require('express');
const { generateAIResponseEndpoint } = require('../controllers/aiController');

const router = express.Router();

// AI generation endpoint
router.post('/generate', generateAIResponseEndpoint);

module.exports = router;
