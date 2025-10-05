/**
 * Speech Processing Module
 * 
 * This module contains all speech processing functionality for medical conversations.
 * It includes transcription, medical information extraction, and patient record updates.
 */

const SpeechProcessingService = require('./SpeechProcessingService');
const MedicalInfoExtractor = require('./MedicalInfoExtractor');
const { upload, speechController } = require('./speechController');
const speechRoutes = require('./speech');

module.exports = {
  // Services
  SpeechProcessingService,
  MedicalInfoExtractor,
  
  // Controllers and Routes
  speechController,
  speechRoutes,
  upload,
  
  // Utility functions
  createSpeechProcessingMiddleware: () => {
    return {
      upload,
      processSpeech: speechController.processSpeech,
      transcribeOnly: speechController.transcribeOnly,
      extractFromText: speechController.extractFromText,
      getProcessingInfo: speechController.getProcessingInfo
    };
  }
};

