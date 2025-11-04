import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import speechProcessingService from "@/modules/speech/services/SpeechProcessingService";

export default function VoiceRecordingButton({ 
  patientId, 
  onProcessingComplete, 
  onError,
  className = "",
  size = "sm",
  variant = "outline",
  disabled = false
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const permission = await speechProcessingService.requestMicrophonePermission();
      setHasPermission(permission);
      if (!permission) {
        setError('Microphone permission required');
      }
    } catch (err) {
      setError('Failed to access microphone');
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      setStatus('Starting recording...');
      
      const success = await speechProcessingService.startRecording();
      if (success) {
        setIsRecording(true);
        setStatus('Recording conversation...');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      setError(error.message);
      setStatus(null);
    }
  };

  const stopRecording = async () => {
    try {
      setStatus('Stopping recording...');
      const audioBlob = await speechProcessingService.stopRecording();
      
      if (audioBlob) {
        setIsRecording(false);
        setIsProcessing(true);
        setStatus('Processing audio...');

        // Process the audio with medical extraction
        const result = await speechProcessingService.processSpeechWithExtraction(
          audioBlob, 
          patientId,
          { language: 'en' }
        );

        if (result.success) {
          setStatus('Processing complete!');
          
          // Call the completion callback with the extracted data
          if (onProcessingComplete) {
            onProcessingComplete(result.data.medicalExtraction.extractedData);
          }
        } else {
          setError(result.error || 'Processing failed');
        }
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      setError(error.message);
      setStatus(null);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatus(null), 5000);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getStatusIcon = () => {
    if (isProcessing) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    if (isRecording) {
      return <MicOff className="w-4 h-4" />;
    }
    return <Mic className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (isProcessing) {
      return 'Processing...';
    }
    if (isRecording) {
      return 'Stop Recording';
    }
    return 'Record Conversation';
  };

  const getButtonVariant = () => {
    if (isRecording) {
      return 'destructive';
    }
    return variant;
  };

  const getButtonClassName = () => {
    const baseClasses = 'flex items-center gap-2';
    
    if (isRecording) {
      return `${baseClasses} bg-red-100 border-red-300 text-red-700 hover:bg-red-200`;
    }
    
    if (isProcessing) {
      return `${baseClasses} bg-blue-100 border-blue-300 text-blue-700`;
    }
    
    return `${baseClasses} hover:bg-gray-50`;
  };

  if (!speechProcessingService.isSupported()) {
    return (
      <div className={`flex items-center gap-2 text-red-500 ${className}`}>
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Speech processing not supported</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        size={size}
        variant={getButtonVariant()}
        onClick={handleClick}
        disabled={disabled || isProcessing || !hasPermission}
        className={getButtonClassName()}
      >
        {getStatusIcon()}
        <span className="text-sm">
          {getStatusText()}
        </span>
      </Button>
      
      {/* Status Messages */}
      {status && (
        <div className={`mt-2 flex items-center gap-2 text-xs p-2 rounded-md ${
          status.includes('complete') 
            ? 'bg-green-50 text-green-600' 
            : 'bg-blue-50 text-blue-600'
        }`}>
          {status.includes('complete') ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <Loader2 className="w-3 h-3 animate-spin" />
          )}
          <span>{status}</span>
        </div>
      )}
      
      {/* Error Messages */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-xs p-2 rounded-md bg-red-50 text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Permission Warning */}
      {!hasPermission && !error && (
        <div className="mt-2 text-xs text-amber-600">
          Microphone permission required
        </div>
      )}
    </div>
  );
}
