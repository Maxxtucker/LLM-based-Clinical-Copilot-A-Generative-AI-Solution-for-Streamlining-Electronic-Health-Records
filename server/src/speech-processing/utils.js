/**
 * Speech Processing Utilities
 * 
 * Common utility functions for speech processing operations.
 */

const fs = require('fs');
const path = require('path');
const { config } = require('./config');

/**
 * Ensure temp directory exists
 */
const ensureTempDir = () => {
  const tempDir = path.resolve(config.audio.tempDir);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
};

/**
 * Generate unique filename for temp files
 */
const generateTempFilename = (extension = 'webm') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `audio_${timestamp}_${random}.${extension}`;
};

/**
 * Clean up temp files
 */
const cleanupTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error);
  }
  return false;
};

/**
 * Validate audio buffer
 */
const validateAudioBuffer = (buffer) => {
  const minSize = 1000; // 1KB minimum
  const maxSize = config.audio.maxFileSize;

  if (!buffer || buffer.length < minSize) {
    return { valid: false, error: 'Audio file too small' };
  }

  if (buffer.length > maxSize) {
    return { valid: false, error: `Audio file too large (max ${Math.round(maxSize / 1024 / 1024)}MB)` };
  }

  return { valid: true };
};

/**
 * Get audio format from buffer
 */
const detectAudioFormat = (buffer) => {
  // Simple format detection based on file headers
  if (buffer.length < 12) return 'unknown';
  
  // WebM
  if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
    return 'webm';
  }
  
  // MP3
  if ((buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) || 
      (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33)) {
    return 'mp3';
  }
  
  // WAV
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return 'wav';
  }
  
  // OGG
  if (buffer[0] === 0x4F && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
    return 'ogg';
  }
  
  return 'unknown';
};

/**
 * Format file size for display
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format duration for display
 */
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Create error response object
 */
const createErrorResponse = (message, details = null, code = 500) => {
  return {
    success: false,
    error: message,
    details,
    code,
    timestamp: new Date().toISOString()
  };
};

/**
 * Create success response object
 */
const createSuccessResponse = (data, message = null) => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
};

/**
 * Log processing activity
 */
const logProcessing = (level, message, data = null) => {
  if (!config.logging.enableDetailedLogs && level === 'debug') {
    return;
  }
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };
  
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || '');
};

/**
 * Retry function with exponential backoff
 */
const retryWithBackoff = async (fn, maxAttempts = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logProcessing('warn', `Attempt ${attempt} failed, retrying in ${delay}ms`, { error: error.message });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Sanitize filename for safe storage
 */
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

/**
 * Check if processing should be allowed based on limits
 */
const canProcessRequest = () => {
  // This would integrate with a rate limiting system in production
  // For now, just return true
  return true;
};

module.exports = {
  ensureTempDir,
  generateTempFilename,
  cleanupTempFile,
  validateAudioBuffer,
  detectAudioFormat,
  formatFileSize,
  formatDuration,
  createErrorResponse,
  createSuccessResponse,
  logProcessing,
  retryWithBackoff,
  sanitizeFilename,
  canProcessRequest
};


