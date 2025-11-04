import OpenAI from 'openai';

// Initialize OpenAI client for Whisper
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

/**
 * Convert audio blob to text using OpenAI Whisper API
 * @param {Blob} audioBlob - The audio blob to transcribe
 * @param {string} language - Optional language code (e.g., 'en', 'es', 'fr')
 * @returns {Promise<string>} - The transcribed text
 */
export async function transcribeAudio(audioBlob, language = 'en') {
  try {
    // Convert blob to File object for Whisper API
    const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: language,
      response_format: 'text'
    });

    return transcription;
  } catch (error) {
    console.error('Whisper API Error:', error);
    throw new Error('Failed to transcribe audio. Please check your API key and try again.');
  }
}

/**
 * Get available audio input devices
 * @returns {Promise<MediaDeviceInfo[]>} - Array of available audio input devices
 */
export async function getAudioDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  } catch (error) {
    console.error('Error getting audio devices:', error);
    return [];
  }
}

/**
 * Request microphone permission
 * @returns {Promise<boolean>} - True if permission granted, false otherwise
 */
export async function requestMicrophonePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately as we just needed to check permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}

/**
 * Start audio recording
 * @param {Function} onDataAvailable - Callback when audio data is available
 * @param {Function} onError - Callback for errors
 * @returns {Promise<MediaRecorder>} - The MediaRecorder instance
 */
export async function startRecording(onDataAvailable, onError) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000
      } 
    });

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    const audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      onDataAvailable(audioBlob);
      // Stop all tracks to release microphone
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event.error);
      onError(event.error);
    };

    mediaRecorder.start(1000); // Collect data every second
    return mediaRecorder;
  } catch (error) {
    console.error('Error starting recording:', error);
    onError(error);
    throw error;
  }
}

/**
 * Stop audio recording
 * @param {MediaRecorder} mediaRecorder - The MediaRecorder instance to stop
 */
export function stopRecording(mediaRecorder) {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
}

/**
 * Check if speech-to-text is supported in the current browser
 * @returns {boolean} - True if supported, false otherwise
 */
export function isSpeechToTextSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
}

/**
 * Get the best supported audio format for the current browser
 * @returns {string} - The MIME type for the best supported format
 */
export function getBestAudioFormat() {
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

const SpeechToTextService = {
  transcribeAudio,
  getAudioDevices,
  requestMicrophonePermission,
  startRecording,
  stopRecording,
  isSpeechToTextSupported,
  getBestAudioFormat
};

export default SpeechToTextService;
