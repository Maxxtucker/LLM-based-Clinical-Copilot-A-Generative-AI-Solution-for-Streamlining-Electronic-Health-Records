import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Mic, MicOff, Volume2, Copy, Check } from 'lucide-react';
import SpeechInput from '../ui/SpeechInput';

export default function SpeechToTextDemo() {
  const [transcription, setTranscription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranscription = (text) => {
    setTranscription(prev => prev + (prev ? ' ' : '') + text);
  };

  const handleClear = () => {
    setTranscription('');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Volume2 className="w-6 h-6 text-blue-600" />
            Speech-to-Text Demo
          </CardTitle>
          <p className="text-neutral-600">
            Test the speech-to-text functionality using OpenAI's Whisper API. 
            Click the microphone button to start recording your voice.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">
                Transcribed Text
              </label>
              <Textarea
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                className="min-h-[200px]"
                placeholder="Your transcribed text will appear here..."
              />
            </div>
            
            <div className="flex items-center gap-3">
              <SpeechInput
                onTranscription={handleTranscription}
                placeholder="Click microphone to start speaking..."
                className="flex-shrink-0"
              />
              
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={!transcription}
                className="flex items-center gap-2"
              >
                Clear
              </Button>
              
              <Button
                variant="outline"
                onClick={handleCopy}
                disabled={!transcription}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click the microphone button to start recording</li>
              <li>• Speak clearly into your microphone</li>
              <li>• Click "Stop Recording" when finished</li>
              <li>• The text will be transcribed using OpenAI Whisper</li>
              <li>• You can edit the transcribed text manually if needed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
