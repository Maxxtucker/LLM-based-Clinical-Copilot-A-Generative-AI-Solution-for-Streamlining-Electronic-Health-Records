/**
 * Speech Processing Configuration
 * 
 * Centralized configuration for all speech processing functionality.
 * Environment variables are loaded here with fallback defaults.
 */

require('dotenv').config();

const config = {
  // API Keys
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4'
  },
  
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY || '',
    model: process.env.HF_MEDICAL_WHISPER_MODEL || 'openai/whisper-base'
  },
  
  // Audio Processing
  audio: {
    maxFileSize: parseInt(process.env.MAX_AUDIO_FILE_SIZE) || 25 * 1024 * 1024, // 25MB
    maxDuration: parseInt(process.env.MAX_AUDIO_DURATION) || 25 * 60, // 25 minutes
    supportedFormats: ['webm', 'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'ogg'],
    tempDir: process.env.TEMP_DIR || './temp',
    sampleRate: 16000
  },
  
  // Medical Information Extraction
  extraction: {
    confidenceThreshold: parseFloat(process.env.MEDICAL_EXTRACTION_CONFIDENCE_THRESHOLD) || 0.7,
    enableNegationDetection: process.env.ENABLE_NEGATION_DETECTION === 'true',
    enableOntologyNormalization: process.env.ENABLE_ONTOLOGY_NORMALIZATION === 'true',
    enableRegexExtraction: process.env.ENABLE_REGEX_EXTRACTION !== 'false',
    enableLLMExtraction: process.env.ENABLE_LLM_EXTRACTION !== 'false'
  },
  
  // Processing Limits
  limits: {
    maxConcurrentProcessing: parseInt(process.env.MAX_CONCURRENT_PROCESSING) || 5,
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 60000, // 60 seconds
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS) || 3
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableDetailedLogs: process.env.ENABLE_DETAILED_LOGS === 'true'
  }
};

// Validation
const validateConfig = () => {
  const errors = [];
  
  if (!config.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required');
  }
  
  if (!config.huggingface.apiKey) {
    errors.push('HUGGINGFACE_API_KEY is required');
  }
  
  if (config.audio.maxFileSize > 100 * 1024 * 1024) {
    errors.push('MAX_AUDIO_FILE_SIZE cannot exceed 100MB');
  }
  
  if (errors.length > 0) {
    console.warn('Configuration validation warnings:', errors);
  }
  
  return errors.length === 0;
};

// Initialize configuration
const isValid = validateConfig();

module.exports = {
  config,
  validateConfig,
  isValid
};

