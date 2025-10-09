/**
 * Frontend Speech Processing Service
 * 
 * Handles communication with the backend speech processing API
 * and provides a clean interface for recording and processing audio.
 */

class FrontendSpeechProcessingService {
  constructor() {
    this.baseURL = '/api/speech';
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  /**
   * Start audio recording
   */
  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.getBestAudioFormat()
      });

      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start(1000);
      this.isRecording = true;
      
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Could not access microphone');
    }
  }

  /**
   * Stop audio recording and return audio blob
   */
  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.isRecording = false;
      
      return new Promise((resolve) => {
        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          resolve(audioBlob);
        };
      });
    }
    return null;
  }

  /**
   * Process audio with medical information extraction
   */
  async processSpeechWithExtraction(audioBlob, patientId, options = {}) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'conversation.webm');
      
      if (patientId) {
        formData.append('patientId', patientId);
      }
      
      formData.append('language', options.language || 'en');
      
      if (options.context) {
        formData.append('context', JSON.stringify(options.context));
      }

      const response = await fetch(`${this.baseURL}/process`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Speech processing failed');
      }

      return result;
    } catch (error) {
      console.error('Speech processing error:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio only (no medical extraction)
   */
  async transcribeOnly(audioBlob, options = {}) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'conversation.webm');
      formData.append('language', options.language || 'en');

      const response = await fetch(`${this.baseURL}/transcribe`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Transcription failed');
      }

      return result;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  /**
   * Extract medical information from text
   */
  async extractFromText(text, patientId) {
    try {
      const response = await fetch(`${this.baseURL}/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          patientId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Medical extraction failed');
      }

      return result;
    } catch (error) {
      console.error('Medical extraction error:', error);
      throw error;
    }
  }

  /**
   * Get processing capabilities and supported formats
   */
  async getProcessingInfo() {
    try {
      const response = await fetch(`${this.baseURL}/info`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get processing info');
      }

      return result;
    } catch (error) {
      console.error('Error getting processing info:', error);
      throw error;
    }
  }

  /**
   * Check if speech processing is supported
   */
  isSupported() {
    return !!(
      navigator.mediaDevices && 
      navigator.mediaDevices.getUserMedia && 
      window.MediaRecorder
    );
  }

  /**
   * Request microphone permission
   */
  async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  /**
   * Get the best supported audio format
   */
  getBestAudioFormat() {
    const formats = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];

    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format)) {
        return format;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Get current recording status
   */
  getRecordingStatus() {
    return {
      isRecording: this.isRecording,
      mediaRecorder: this.mediaRecorder,
      audioChunks: this.audioChunks
    };
  }

  /**
   * Reset recording state
   */
  reset() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

// Create and export a singleton instance
const speechProcessingService = new FrontendSpeechProcessingService();
export default speechProcessingService;


