/**
 * Voice Input Component
 *
 * Records audio and transcribes via OpenAI Whisper (server-side).
 * Works in any browser that supports MediaRecorder + getUserMedia.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
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
import { Mic, Square, Pause, Play, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { transcribeAudio } from '@/lib/api/aiCaseTaking.api';

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

function isVoiceSupported(): boolean {
  return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
}

export function VoiceInput({
  onTranscriptReady,
  onExtract,
  extracting = false,
}: VoiceInputProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleStart = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      toast.info('Recording started. Speak clearly. Stop when done to transcribe.');
    } catch (err: any) {
      const msg = err?.message || 'Could not access microphone';
      setError(msg);
      toast.error(msg);
    }
  }, []);

  const handlePause = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === 'recording') {
      rec.pause();
      setIsPaused(true);
      toast.info('Recording paused.');
    }
  }, []);

  const handleResume = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === 'paused') {
      rec.resume();
      setIsPaused(false);
      toast.info('Recording resumed.');
    }
  }, []);

  const handleStop = useCallback(async () => {
    const rec = mediaRecorderRef.current;
    if (!rec || (rec.state !== 'recording' && rec.state !== 'paused')) return;

    rec.onstop = async () => {
      stopStream();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);

      const chunks = chunksRef.current;
      if (chunks.length === 0) {
        toast.error('No audio recorded.');
        return;
      }

      const blob = new Blob(chunks, { type: 'audio/webm' });
      setTranscribing(true);
      setError(null);
      try {
        const { text } = await transcribeAudio(blob, selectedLanguage);
        setTranscript(text);
        if (onTranscriptReady) onTranscriptReady(text);
        toast.success('Transcription ready.');
      } catch (err: any) {
        const msg = err?.message || 'Transcription failed';
        setError(msg);
        toast.error(msg);
      } finally {
        setTranscribing(false);
      }
    };

    rec.stop();
    toast.info('Recording stopped. Transcribing…');
  }, [selectedLanguage, onTranscriptReady, stopStream]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRecording && !isPaused) {
      interval = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused]);

  const handleClear = () => {
    setTranscript('');
    setError(null);
    toast.info('Transcript cleared.');
  };

  const handleExtract = () => {
    if (!transcript.trim()) {
      toast.error('No transcript available. Please record something first.');
      return;
    }
    onExtract?.(transcript.trim());
  };

  const supported = isVoiceSupported();

  if (!supported) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Voice recording is not supported in this browser. Please use a modern browser (Chrome, Edge, Firefox, Safari) with microphone access.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Language:</label>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isRecording || transcribing}>
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
        {transcribing && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Transcribing…
          </Badge>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Voice Recording (Whisper)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            {!isRecording && !isPaused && (
              <Button
                onClick={handleStart}
                size="lg"
                className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90"
                disabled={transcribing}
              >
                <Mic className="h-6 w-6" />
              </Button>
            )}

            {isRecording && !isPaused && (
              <>
                <Button onClick={handlePause} variant="outline" size="lg" className="rounded-full h-12 w-12">
                  <Pause className="h-5 w-5" />
                </Button>
                <Button onClick={handleStop} size="lg" className="rounded-full h-16 w-16 bg-red-500 hover:bg-red-600">
                  <Square className="h-6 w-6" />
                </Button>
              </>
            )}

            {isPaused && (
              <>
                <Button onClick={handleResume} size="lg" className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90">
                  <Play className="h-6 w-6" />
                </Button>
                <Button onClick={handleStop} variant="outline" size="lg" className="rounded-full h-12 w-12">
                  <Square className="h-5 w-5" />
                </Button>
              </>
            )}

            {transcript && !isRecording && (
              <Button onClick={handleClear} variant="ghost" size="lg" className="rounded-full h-12 w-12" title="Clear transcript">
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="text-center">
            {isRecording && !isPaused && (
              <p className="text-sm text-muted-foreground animate-pulse">🎤 Recording… Speak clearly</p>
            )}
            {isPaused && <p className="text-sm text-muted-foreground">⏸️ Paused</p>}
            {transcribing && <p className="text-sm text-muted-foreground">Transcribing with Whisper…</p>}
            {!isRecording && !transcript && !transcribing && (
              <p className="text-sm text-muted-foreground">Click the microphone to start recording</p>
            )}
          </div>
        </CardContent>
      </Card>

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
                <p className="text-sm whitespace-pre-wrap text-foreground">{transcript}</p>
              </div>
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

      {!transcript && !isRecording && !transcribing && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Mic className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                Record your case notes. When you stop, the audio is sent to Whisper for accurate transcription.
              </p>
              <p className="text-xs text-muted-foreground">
                Works in all modern browsers. Better accuracy and Hindi/English mix than browser-only recognition.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
