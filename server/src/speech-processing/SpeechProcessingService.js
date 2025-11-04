const { HfInference } = require('@huggingface/inference');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const { config } = require('./config');
const { 
  ensureTempDir, 
  generateTempFilename, 
  cleanupTempFile, 
  validateAudioBuffer,
  logProcessing 
} = require('./utils');

class SpeechProcessingService {
  constructor() {
    // Only initialize HuggingFace if API key is provided
    if (config.huggingface.apiKey) {
      this.hf = new HfInference(config.huggingface.apiKey);
      this.model = config.huggingface.model;
    } else {
      this.hf = null;
      console.warn('HuggingFace API key not configured - using OpenAI Whisper only');
    }
    
    // Fallback to OpenAI Whisper if HF fails
    this.openai = new (require('openai'))({
      apiKey: config.openai.apiKey
    });
  }

  /**
   * Process audio file with Medical Whisper
   */
  async transcribeWithMedicalWhisper(audioBuffer, options = {}) {
    try {
      // If HuggingFace is not configured, use OpenAI directly
      if (!this.hf) {
        logProcessing('info', 'HuggingFace not configured, using OpenAI Whisper directly...');
        return await this.transcribeWithOpenAIWhisper(audioBuffer, options);
      }
      
      logProcessing('info', 'Starting Medical Whisper transcription...');
      
      // Convert buffer to file for HF API
      const tempDir = ensureTempDir();
      const tempFilePath = path.join(tempDir, generateTempFilename());
      
      fs.writeFileSync(tempFilePath, audioBuffer);

      try {
        // Read file as stream for HF API
        const audioFile = fs.createReadStream(tempFilePath);
        
        const response = await this.hf.automaticSpeechRecognition({
          model: this.model,
          inputs: audioFile,
          parameters: {
            language: options.language || 'en',
            task: 'transcribe',
            return_timestamps: false
          }
        });

        logProcessing('info', 'Medical Whisper transcription successful');
        return {
          success: true,
          transcription: response.text,
          model: this.model,
          confidence: response.confidence || 0.8
        };

      } catch (hfError) {
        logProcessing('warn', 'Medical Whisper failed, falling back to OpenAI Whisper', { error: hfError.message });
        
        // Fallback to OpenAI Whisper
        return await this.transcribeWithOpenAIWhisper(audioBuffer, options);
      } finally {
        // Clean up temp file
        cleanupTempFile(tempFilePath);
      }

    } catch (error) {
      console.error('Speech processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fallback transcription using OpenAI Whisper
   */
  async transcribeWithOpenAIWhisper(audioBuffer, options = {}) {
    try {
      console.log('Using OpenAI Whisper fallback...');
      
      // Create a temporary file for OpenAI API
      const tempFilePath = path.join(__dirname, '../../temp', `audio_${Date.now()}.webm`);
      
      // Ensure temp directory exists
      const tempDir = path.dirname(tempFilePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      fs.writeFileSync(tempFilePath, audioBuffer);

      try {
        const transcription = await this.openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model: 'whisper-1',
          language: options.language || 'en',
          response_format: 'verbose_json'
        });

        console.log('OpenAI Whisper transcription successful');
        return {
          success: true,
          transcription: transcription.text,
          model: 'whisper-1',
          confidence: transcription.segments?.[0]?.avg_logprob ? Math.exp(transcription.segments[0].avg_logprob) : 0.8
        };

      } finally {
        // Clean up temp file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }

    } catch (error) {
      console.error('OpenAI Whisper error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process audio with medical context optimization
   */
  async processMedicalConversation(audioBuffer, context = {}) {
    try {
      // Transcribe with OpenAI Whisper (Medical Whisper disabled due to API issues)
      const transcriptionResult = await this.transcribeWithOpenAIWhisper(audioBuffer, {
        language: context.language || 'en'
      });

      if (!transcriptionResult.success) {
        return transcriptionResult;
      }

      // Post-process transcription for medical terminology
      const processedTranscription = this.postProcessMedicalTranscription(
        transcriptionResult.transcription,
        context
      );

      return {
        ...transcriptionResult,
        transcription: processedTranscription,
        processed: true
      };

    } catch (error) {
      console.error('Medical conversation processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Post-process transcription for medical terminology accuracy
   */
  postProcessMedicalTranscription(transcription, context = {}) {
    let processed = transcription;

    // Medical terminology corrections
    const medicalCorrections = {
      // Common medical abbreviations and terms
      'BP': 'blood pressure',
      'HR': 'heart rate',
      'RR': 'respiratory rate',
      'O2 sat': 'oxygen saturation',
      'temp': 'temperature',
      'wt': 'weight',
      'ht': 'height',
      'BMI': 'body mass index',
      'CBC': 'complete blood count',
      'BMP': 'basic metabolic panel',
      'CMP': 'comprehensive metabolic panel',
      'EKG': 'electrocardiogram',
      'ECG': 'electrocardiogram',
      'CT': 'computed tomography',
      'MRI': 'magnetic resonance imaging',
      'CXR': 'chest X-ray',
      'UA': 'urinalysis',
      'UTI': 'urinary tract infection',
      'COPD': 'chronic obstructive pulmonary disease',
      'DM': 'diabetes mellitus',
      'HTN': 'hypertension',
      'CAD': 'coronary artery disease',
      'MI': 'myocardial infarction',
      'CHF': 'congestive heart failure',
      'AFib': 'atrial fibrillation',
      'DVT': 'deep vein thrombosis',
      'PE': 'pulmonary embolism',
      'SOB': 'shortness of breath',
      'CP': 'chest pain',
      'N/V': 'nausea and vomiting',
      'D/C': 'discharge',
      'PRN': 'as needed',
      'BID': 'twice daily',
      'TID': 'three times daily',
      'QID': 'four times daily',
      'QD': 'daily',
      'QHS': 'at bedtime',
      'AC': 'before meals',
      'PC': 'after meals'
    };

    // Apply corrections
    Object.entries(medicalCorrections).forEach(([abbrev, full]) => {
      const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
      processed = processed.replace(regex, full);
    });

    // Improve punctuation for medical context
    processed = processed
      .replace(/(\d+)\s*\/\s*(\d+)/g, '$1/$2') // Fix blood pressure formatting
      .replace(/(\d+)\s*bpm/gi, '$1 BPM') // Standardize BPM
      .replace(/(\d+)\s*degrees?\s*fahrenheit?/gi, '$1°F') // Standardize temperature
      .replace(/(\d+)\s*mg/gi, '$1 mg') // Standardize medication dosages
      .replace(/(\d+)\s*mcg/gi, '$1 mcg') // Standardize microgram dosages
      .replace(/(\d+)\s*units?/gi, '$1 units') // Standardize units
      .replace(/\s+/g, ' ') // Clean up multiple spaces
      .trim();

    return processed;
  }

  /**
   * Validate audio format and quality
   */
  validateAudioFormat(audioBuffer) {
    const minSize = 1000; // 1KB minimum
    const maxSize = 25 * 1024 * 1024; // 25MB maximum (OpenAI limit)

    if (audioBuffer.length < minSize) {
      return { valid: false, error: 'Audio file too small' };
    }

    if (audioBuffer.length > maxSize) {
      return { valid: false, error: 'Audio file too large (max 25MB)' };
    }

    return { valid: true };
  }

  /**
   * Get supported audio formats
   */
  getSupportedFormats() {
    return {
      input: ['webm', 'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'ogg'],
      recommended: 'webm',
      maxSize: '25MB',
      maxDuration: '25 minutes'
    };
  }
}

module.exports = SpeechProcessingService;
