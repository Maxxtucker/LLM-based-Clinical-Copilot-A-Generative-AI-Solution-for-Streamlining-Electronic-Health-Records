const multer = require('multer');
const SpeechProcessingService = require('./SpeechProcessingService');
const MedicalInfoExtractor = require('./MedicalInfoExtractor');
const Patient = require('../models/Patient');
const asyncHandler = require('../utils/asyncHandler');
const { config } = require('./config');
const { 
  validateAudioBuffer, 
  logProcessing, 
  createErrorResponse, 
  createSuccessResponse 
} = require('./utils');

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: config.audio.maxFileSize,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg',
      'audio/mpeg', 'audio/mpga', 'audio/m4a'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type'), false);
    }
  }
});

class SpeechController {
  constructor() {
    this.speechService = new SpeechProcessingService();
    this.medicalExtractor = new MedicalInfoExtractor();
  }

  /**
   * Process audio file and extract medical information
   */
  processSpeech = asyncHandler(async (req, res) => {
    try {
      const { patientId, language = 'en', context = {} } = req.body;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No audio file provided'
        });
      }

      // Validate audio format
      const validation = this.speechService.validateAudioFormat(req.file.buffer);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      console.log(`Processing speech for patient ${patientId}...`);

      // Step 1: Transcribe audio
      const transcriptionResult = await this.speechService.processMedicalConversation(
        req.file.buffer,
        { language, ...context }
      );

      if (!transcriptionResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Speech transcription failed',
          details: transcriptionResult.error
        });
      }

      // Step 2: Extract medical information
      const extractionResult = await this.medicalExtractor.extractMedicalInfo(
        transcriptionResult.transcription
      );

      if (!extractionResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Medical information extraction failed',
          details: extractionResult.error
        });
      }

      // Step 3: Update patient record if patientId provided
      let patientUpdate = null;
      if (patientId) {
        try {
          const updateFields = await this.medicalExtractor.updatePatientRecord(
            patientId,
            extractionResult.data
          );

          // Update patient in database
          const updatedPatient = await Patient.findByIdAndUpdate(
            patientId,
            { $set: updateFields },
            { new: true, runValidators: true }
          );

          if (!updatedPatient) {
            console.warn(`Patient ${patientId} not found for update`);
          } else {
            patientUpdate = {
              success: true,
              patientId: updatedPatient._id,
              updatedFields: Object.keys(updateFields)
            };
          }
        } catch (updateError) {
          console.error('Patient update error:', updateError);
          patientUpdate = {
            success: false,
            error: updateError.message
          };
        }
      }

      // Return comprehensive results
      res.json({
        success: true,
        data: {
          transcription: {
            text: transcriptionResult.transcription,
            model: transcriptionResult.model,
            confidence: transcriptionResult.confidence,
            processed: transcriptionResult.processed
          },
          medicalExtraction: {
            extractedData: extractionResult.data,
            confidence: extractionResult.confidence,
            method: extractionResult.extractionMethod
          },
          patientUpdate,
          metadata: {
            processingTime: new Date().toISOString(),
            fileSize: req.file.size,
            language: language
          }
        }
      });

    } catch (error) {
      console.error('Speech processing controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  });

  /**
   * Get processing status and supported formats
   */
  getProcessingInfo = asyncHandler(async (req, res) => {
    const supportedFormats = this.speechService.getSupportedFormats();
    
    res.json({
      success: true,
      data: {
        supportedFormats,
        models: {
          primary: process.env.HF_MEDICAL_WHISPER_MODEL || 'openai/whisper-large-v3',
          fallback: 'OpenAI Whisper-1'
        },
        features: [
          'Medical terminology optimization',
          'Hybrid information extraction',
          'Automatic patient record updates',
          'Negation detection',
          'Confidence scoring'
        ]
      }
    });
  });

  /**
   * Process speech without patient update (transcription only)
   */
  transcribeOnly = asyncHandler(async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No audio file provided'
        });
      }

      const { language = 'en' } = req.body;

      // Validate audio format
      const validation = this.speechService.validateAudioFormat(req.file.buffer);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      // Transcribe audio
      const transcriptionResult = await this.speechService.processMedicalConversation(
        req.file.buffer,
        { language }
      );

      if (!transcriptionResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Speech transcription failed',
          details: transcriptionResult.error
        });
      }

      res.json({
        success: true,
        data: {
          transcription: transcriptionResult.transcription,
          model: transcriptionResult.model,
          confidence: transcriptionResult.confidence,
          processed: transcriptionResult.processed
        }
      });

    } catch (error) {
      console.error('Transcription controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  });

  /**
   * Extract medical information from text (without audio)
   */
  extractFromText = asyncHandler(async (req, res) => {
    try {
      const { text, patientId } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Text content is required'
        });
      }

      // Extract medical information
      const extractionResult = await this.medicalExtractor.extractMedicalInfo(text);

      if (!extractionResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Medical information extraction failed',
          details: extractionResult.error
        });
      }

      // Update patient record if patientId provided
      let patientUpdate = null;
      if (patientId) {
        try {
          const updateFields = await this.medicalExtractor.updatePatientRecord(
            patientId,
            extractionResult.data
          );

          const updatedPatient = await Patient.findByIdAndUpdate(
            patientId,
            { $set: updateFields },
            { new: true, runValidators: true }
          );

          if (updatedPatient) {
            patientUpdate = {
              success: true,
              patientId: updatedPatient._id,
              updatedFields: Object.keys(updateFields)
            };
          }
        } catch (updateError) {
          console.error('Patient update error:', updateError);
          patientUpdate = {
            success: false,
            error: updateError.message
          };
        }
      }

      res.json({
        success: true,
        data: {
          extractedData: extractionResult.data,
          confidence: extractionResult.confidence,
          method: extractionResult.extractionMethod,
          patientUpdate
        }
      });

    } catch (error) {
      console.error('Text extraction controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  });
}

// Export upload middleware and controller
module.exports = {
  upload,
  speechController: new SpeechController()
};
