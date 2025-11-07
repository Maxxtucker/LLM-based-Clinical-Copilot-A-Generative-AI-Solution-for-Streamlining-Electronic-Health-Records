import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './button';
import SpeechToTextService from '../../services/SpeechToTextService';

export default function SpeechInput({ 
  onTranscription, 
  onError, 
  placeholder = "Click microphone to speak...",
  disabled = false,
  className = "",
  language = 'en'
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    // Check if speech-to-text is supported
    if (!SpeechToTextService.isSpeechToTextSupported()) {
      setIsSupported(false);
      setError('Speech-to-text is not supported in this browser');
      return;
    }

    // Check microphone permission
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const hasPermission = await SpeechToTextService.requestMicrophonePermission();
      setHasPermission(hasPermission);
      if (!hasPermission) {
        setError('Microphone permission is required for speech-to-text');
      }
    } catch (err) {
      setError('Failed to access microphone');
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      const permission = await SpeechToTextService.requestMicrophonePermission();
      if (!permission) {
        setError('Microphone permission is required');
        return;
      }
      setHasPermission(true);
    }

    try {
      setError(null);
      setIsRecording(true);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: SpeechToTextService.getBestAudioFormat()
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setError('Recording error: ' + event.error.message);
        setIsRecording(false);
      };

      mediaRecorder.start(1000); // Collect data every second
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording: ' + err.message);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      setIsTranscribing(true);
      setError(null);
      
      const transcription = await SpeechToTextService.transcribeAudio(audioBlob, language);
      
      if (onTranscription) {
        onTranscription(transcription);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Failed to transcribe audio: ' + err.message);
      if (onError) {
        onError(err);
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-red-500 ${className}`}>
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Speech-to-text not supported</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleMicClick}
        disabled={disabled || isTranscribing || !hasPermission}
        className={`flex items-center gap-2 ${
          isRecording 
            ? 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200' 
            : 'hover:bg-gray-50'
        }`}
      >
        {isTranscribing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
        <span className="text-sm">
          {isTranscribing 
            ? 'Transcribing...' 
            : isRecording 
            ? 'Stop Recording' 
            : 'Start Recording'
          }
        </span>
      </Button>
      
      {error && (
        <div className="flex items-center gap-1 text-red-500">
          <AlertCircle className="w-3 h-3" />
          <span className="text-xs">{error}</span>
        </div>
      )}
      
      {!hasPermission && !error && (
        <div className="text-xs text-amber-600">
          Microphone permission required
        </div>
      )}
    </div>
  );
}
