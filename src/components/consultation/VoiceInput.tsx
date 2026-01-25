/**
 * Voice Input Component
 * 
 * Component for voice-based case input with real-time transcription
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mic, MicOff, Square, Pause, Play, Trash2, AlertCircle } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VoiceInputProps {
  onTranscriptReady?: (transcript: string) => void;
  onExtract?: (text: string) => void;
  extracting?: boolean;
}

const SUPPORTED_LANGUAGES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-IN', label: 'English (India)' },
  { value: 'hi-IN', label: 'Hindi (India)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
];

export function VoiceInput({
  onTranscriptReady,
  onExtract,
  extracting = false,
}: VoiceInputProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [transcript, setTranscript] = useState('');

  const {
    isRecording,
    isPaused,
    transcript: currentTranscript,
    interimTranscript,
    error,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearTranscript,
  } = useVoiceRecorder({
    language: selectedLanguage,
    continuous: true,
    interimResults: true,
    onTranscriptUpdate: (fullTranscript) => {
      setTranscript(fullTranscript);
      if (onTranscriptReady) {
        onTranscriptReady(fullTranscript);
      }
    },
    onError: (errorMessage) => {
      toast.error(errorMessage);
    },
  });

  // Update transcript when it changes
  useEffect(() => {
    setTranscript(currentTranscript + interimTranscript);
  }, [currentTranscript, interimTranscript]);

  const handleStart = () => {
    if (!isSupported) {
      toast.error('Voice recognition is not supported in your browser.');
      return;
    }
    startRecording();
    toast.info('Recording started. Speak clearly...');
  };

  const handleStop = () => {
    stopRecording();
    toast.success('Recording stopped.');
  };

  const handlePause = () => {
    pauseRecording();
    toast.info('Recording paused.');
  };

  const handleResume = () => {
    resumeRecording();
    toast.info('Recording resumed.');
  };

  const handleClear = () => {
    clearTranscript();
    setTranscript('');
    toast.info('Transcript cleared.');
  };

  const handleExtract = () => {
    if (!transcript.trim()) {
      toast.error('No transcript available. Please record something first.');
      return;
    }
    if (onExtract) {
      onExtract(transcript.trim());
    }
  };

  // Calculate recording time (simplified - you can enhance this)
  const [recordingTime, setRecordingTime] = useState(0);
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
      if (!isRecording) {
        setRecordingTime(0);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari for
          voice input.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Language Selection */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Language:</label>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isRecording}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isRecording && (
          <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
            Recording: {formatTime(recordingTime)}
          </Badge>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Voice Recording</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            {!isRecording && !isPaused && (
              <Button
                onClick={handleStart}
                size="lg"
                className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90"
              >
                <Mic className="h-6 w-6" />
              </Button>
            )}

            {isRecording && !isPaused && (
              <>
                <Button
                  onClick={handlePause}
                  variant="outline"
                  size="lg"
                  className="rounded-full h-12 w-12"
                >
                  <Pause className="h-5 w-5" />
                </Button>
                <Button
                  onClick={handleStop}
                  size="lg"
                  className="rounded-full h-16 w-16 bg-red-500 hover:bg-red-600"
                >
                  <Square className="h-6 w-6" />
                </Button>
              </>
            )}

            {isPaused && (
              <>
                <Button
                  onClick={handleResume}
                  size="lg"
                  className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90"
                >
                  <Play className="h-6 w-6" />
                </Button>
                <Button
                  onClick={handleStop}
                  variant="outline"
                  size="lg"
                  className="rounded-full h-12 w-12"
                >
                  <Square className="h-5 w-5" />
                </Button>
              </>
            )}

            {transcript && (
              <Button
                onClick={handleClear}
                variant="ghost"
                size="lg"
                className="rounded-full h-12 w-12"
                title="Clear transcript"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Status Text */}
          <div className="text-center">
            {isRecording && !isPaused && (
              <p className="text-sm text-muted-foreground animate-pulse">
                🎤 Recording... Speak clearly
              </p>
            )}
            {isPaused && <p className="text-sm text-muted-foreground">⏸️ Paused</p>}
            {!isRecording && !isPaused && !transcript && (
              <p className="text-sm text-muted-foreground">Click the microphone to start recording</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transcript Display */}
      {transcript && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Transcript</CardTitle>
              <Badge variant="outline">{transcript.length} characters</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="min-h-[150px] max-h-[300px] overflow-y-auto rounded-lg border border-border/50 bg-muted/30 p-4">
                <p className="text-sm whitespace-pre-wrap">
                  <span className="text-foreground">{currentTranscript}</span>
                  {interimTranscript && (
                    <span className="text-muted-foreground italic">{interimTranscript}</span>
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleExtract}
                  disabled={extracting || !transcript.trim()}
                  className="flex-1"
                >
                  {extracting ? 'Extracting Symptoms...' : 'Extract Symptoms'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!transcript && !isRecording && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Mic className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                Click the microphone button to start recording your case notes
              </p>
              <p className="text-xs text-muted-foreground">
                Speak clearly and naturally. The system will transcribe your speech in real-time.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
