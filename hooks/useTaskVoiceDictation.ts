import { useCallback, useRef, useState } from 'react';
import { NativeModules } from 'react-native';
import type { AppLocale } from '@/lib/i18n';
import { isExpoGoClient } from '@/lib/subscriptionEnvironment';
import { speechRecognitionLocale } from '@/lib/taskVoiceLocale';

type UseTaskVoiceDictationOptions = {
  locale: AppLocale;
  currentText: string;
  onTextChange: (text: string) => void;
  maxLength?: number;
};

export type VoiceDictationToggleResult =
  | { ok: true }
  | { ok: false; reason: 'unavailable' | 'permission' };

type SpeechRecognitionLib = typeof import('expo-speech-recognition');

let speechLibCache: SpeechRecognitionLib | null | undefined;

/** Expo Go no incluye el módulo nativo; require falla sin tumbar la app. */
function getSpeechLib(): SpeechRecognitionLib | null {
  if (speechLibCache !== undefined) return speechLibCache;
  if (isExpoGoClient() || !NativeModules.ExpoSpeechRecognition) {
    speechLibCache = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const lib = require('expo-speech-recognition') as SpeechRecognitionLib;
    if (!lib.ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      speechLibCache = null;
      return null;
    }
    speechLibCache = lib;
    return lib;
  } catch {
    speechLibCache = null;
    return null;
  }
}

function useSpeechRecognitionEventNoop(
  _event: string,
  _listener: (event: unknown) => void,
): void {
  /* Expo Go / sin dev build */
}

function mergeTranscript(prefix: string, transcript: string, maxLength: number): string {
  const base = prefix.trim();
  const spacer = base && !base.endsWith(' ') ? ' ' : '';
  return `${base}${spacer}${transcript.trim()}`.slice(0, maxLength);
}

export function useTaskVoiceDictation({
  locale,
  currentText,
  onTextChange,
  maxLength = 300,
}: UseTaskVoiceDictationOptions) {
  const lib = getSpeechLib();
  const useEvent = lib?.useSpeechRecognitionEvent ?? useSpeechRecognitionEventNoop;
  const prefixRef = useRef('');
  const [isListening, setIsListening] = useState(false);
  const isAvailable = Boolean(lib);

  useEvent('start', () => setIsListening(true));
  useEvent('end', () => setIsListening(false));
  useEvent('result', (raw: unknown) => {
    const event = raw as { results: { transcript?: string }[]; isFinal?: boolean };
    const transcript = event.results[0]?.transcript;
    if (!transcript?.trim()) return;
    onTextChange(mergeTranscript(prefixRef.current, transcript, maxLength));
    if (event.isFinal) {
      try {
        lib?.ExpoSpeechRecognitionModule.stop();
      } catch {
        /* ignore */
      }
    }
  });
  useEvent('error', () => {
    setIsListening(false);
  });

  const stop = useCallback(() => {
    try {
      lib?.ExpoSpeechRecognitionModule.stop();
    } catch {
      /* ignore */
    }
    setIsListening(false);
  }, [lib]);

  const toggle = useCallback(async (): Promise<VoiceDictationToggleResult> => {
    if (!lib || !isAvailable) {
      return { ok: false, reason: 'unavailable' };
    }
    if (isListening) {
      stop();
      return { ok: true };
    }

    const perm = await lib.ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      return { ok: false, reason: 'permission' };
    }

    prefixRef.current = currentText;
    lib.ExpoSpeechRecognitionModule.start({
      lang: speechRecognitionLocale(locale),
      interimResults: true,
      continuous: false,
    });
    return { ok: true };
  }, [currentText, isAvailable, isListening, lib, locale, stop]);

  return { isListening, isAvailable, toggle, stop };
}
