const express = require('express');
const router = express.Router();
const { upload, speechController } = require('./speechController');

/**
 * @route POST /api/speech/process
 * @desc Process audio file and extract medical information, optionally update patient record
 * @access Private (requires authentication in production)
 */
router.post('/process', upload.single('audio'), speechController.processSpeech);

/**
 * @route POST /api/speech/transcribe
 * @desc Transcribe audio file only (no medical extraction or patient update)
 * @access Private (requires authentication in production)
 */
router.post('/transcribe', upload.single('audio'), speechController.transcribeOnly);

/**
 * @route POST /api/speech/extract
 * @desc Extract medical information from text (no audio processing)
 * @access Private (requires authentication in production)
 */
router.post('/extract', speechController.extractFromText);

/**
 * @route GET /api/speech/info
 * @desc Get information about supported formats and processing capabilities
 * @access Public
 */
router.get('/info', speechController.getProcessingInfo);

module.exports = router;
