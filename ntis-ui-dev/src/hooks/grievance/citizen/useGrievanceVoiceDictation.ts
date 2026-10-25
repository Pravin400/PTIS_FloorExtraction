'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface UseGrievanceVoiceDictationProps {
  locale?: string;
  onTranscript: (cleanText: string) => void;
  listeningToastText?: string;
  t?: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function useGrievanceVoiceDictation({
  locale = 'en-IN',
  onTranscript,
  listeningToastText,
  t,
}: UseGrievanceVoiceDictationProps) {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  // Stop active microphone if component unmounts
  useEffect(() => {
    return () => {
      const recognition = speechRecognitionRef.current;
      if (recognition && typeof recognition.stop === 'function') {
        try {
          recognition.stop();
        } catch {}
      }
    };
  }, []);

  const handleToggleVoice = useCallback(() => {
    if (typeof window === 'undefined') return;

    // 1. If currently listening, toggle off
    if (isVoiceActive) {
      const recognition = speechRecognitionRef.current;
      if (recognition && typeof recognition.stop === 'function') {
        try {
          recognition.stop();
        } catch {}
      }
      setIsVoiceActive(false);
      return;
    }

    // 2. Check for browser SpeechRecognition API support
    const speechWindow = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognitionClass = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      toast.warning(
        t?.('voiceDictationUnsupported') ||
          'Voice dictation is not supported in this browser. Please type your description.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      speechRecognitionRef.current = recognition;

      // 3. Set recognition language based on active UI locale (Marathi, Hindi, or English)
      recognition.lang = locale === 'mr' ? 'mr-IN' : locale === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsVoiceActive(true);
        toast.info(listeningToastText || 'Listening... Please speak into your microphone.');
      };

      // 4. Capture real spoken words and pass to onTranscript callback
      recognition.onresult = (event: Event) => {
        const speechEvent = event as Event & {
          resultIndex: number;
          results: Array<{ [index: number]: { transcript: string }; isFinal: boolean }>;
        };
        let transcript = '';
        const results = speechEvent.results;
        for (let i = speechEvent.resultIndex; i < results.length; i++) {
          if (results[i]?.isFinal && results[i][0]?.transcript) {
            transcript += results[i][0].transcript;
          }
        }
        const cleanText = transcript.trim();
        if (cleanText) {
          onTranscript(cleanText);
        }
      };

      recognition.onerror = (event: Event) => {
        const errorEvent = event as Event & { error?: string };
        const errorCode = errorEvent.error || 'unknown';
        console.warn('[SpeechRecognition error]:', errorCode);
        if (errorCode === 'not-allowed') {
          toast.error(
            t?.('voicePermissionDenied') ||
              'Microphone permission denied. Please allow microphone access in your browser settings.'
          );
        } else if (errorCode !== 'no-speech') {
          toast.warning(`Voice recognition notice: ${errorCode}`);
        }
        setIsVoiceActive(false);
      };

      recognition.onend = () => {
        setIsVoiceActive(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('[SpeechRecognition start error]:', err);
      setIsVoiceActive(false);
      toast.error(
        t?.('voiceActivationFailed') ||
          'Could not activate microphone. Please check your browser permissions.'
      );
    }
  }, [isVoiceActive, locale, listeningToastText, onTranscript, t]);

  return {
    isVoiceActive,
    handleToggleVoice,
  };
}
