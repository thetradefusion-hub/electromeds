/**
 * useVoiceRecorder Hook
 * 
 * Custom hook for voice recording using Web Speech API
 * Provides real-time transcription and recording state management
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface VoiceRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
}

export interface UseVoiceRecorderOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onTranscriptUpdate?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const {
    language = 'en-US',
    continuous = true,
    interimResults = true,
    onTranscriptUpdate,
    onError,
  } = options;

  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    isPaused: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    isSupported: false,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');

  // Check browser support
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setState((prev) => ({
        ...prev,
        isSupported: false,
        error: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isSupported: true }));

    // Initialize recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    // Event handlers
    recognition.onstart = () => {
      setState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        error: null,
      }));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      finalTranscriptRef.current = finalTranscript.trim();
      const fullTranscript = finalTranscript + interimTranscript;

      setState((prev) => ({
        ...prev,
        transcript: finalTranscript,
        interimTranscript: interimTranscript,
      }));

      if (onTranscriptUpdate) {
        onTranscriptUpdate(fullTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = 'An error occurred during speech recognition.';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your microphone settings.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'aborted':
          // User stopped recording, not an error
          return;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isRecording: false,
        isPaused: false,
      }));

      if (onError) {
        onError(errorMessage);
      }
    };

    recognition.onend = () => {
      setState((prev) => ({
        ...prev,
        isRecording: false,
        isPaused: false,
      }));
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, continuous, interimResults, onTranscriptUpdate, onError]);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) {
      const error = 'Speech recognition is not available.';
      setState((prev) => ({ ...prev, error }));
      if (onError) onError(error);
      return;
    }

    try {
      finalTranscriptRef.current = state.transcript;
      recognitionRef.current.start();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to start recording.';
      setState((prev) => ({ ...prev, error: errorMessage }));
      if (onError) onError(errorMessage);
    }
  }, [state.transcript, onError]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && state.isRecording) {
      recognitionRef.current.stop();
      setState((prev) => ({
        ...prev,
        isRecording: false,
        isPaused: false,
      }));
    }
  }, [state.isRecording]);

  const pauseRecording = useCallback(() => {
    if (recognitionRef.current && state.isRecording) {
      recognitionRef.current.stop();
      setState((prev) => ({
        ...prev,
        isPaused: true,
        isRecording: false,
      }));
    }
  }, [state.isRecording]);

  const resumeRecording = useCallback(() => {
    if (recognitionRef.current && state.isPaused) {
      startRecording();
    }
  }, [state.isPaused, startRecording]);

  const clearTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setState((prev) => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
    }));
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearTranscript,
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
