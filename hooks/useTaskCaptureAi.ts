import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { interpretTaskCapture } from '@/lib/taskCaptureAi';
import type { ProjectForMatch } from '@/lib/batchProjectMatch';
import {
  applyFallbackDateToCapture,
  isMultiTaskListInput,
  parseTaskCaptureLocally,
} from '@/lib/taskCaptureParseLocal';
import type { TaskCaptureResult } from '@/lib/taskCaptureTypes';

type UseTaskCaptureAiArgs = {
  energyLevel?: number;
  emotionKey?: string;
};

export function useTaskCaptureAi({ energyLevel, emotionKey }: UseTaskCaptureAiArgs = {}) {
  const { user } = useAuth();
  const { locale } = useI18n();
  const [preview, setPreview] = useState<TaskCaptureResult | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);

  const interpret = useCallback(
    async (rawText: string, options?: { projects?: ProjectForMatch[] }) => {
      const trimmed = rawText.trim();
      if (!trimmed) return null;
      setIsInterpreting(true);
      try {
        const result = await interpretTaskCapture(user?.id, {
          rawText: trimmed,
          locale,
          energyLevel,
          emotionKey,
          projects: options?.projects,
        });
        setPreview(result);
        return result;
      } finally {
        setIsInterpreting(false);
      }
    },
    [emotionKey, energyLevel, locale, user?.id],
  );

  /** Vista previa local (comas / renglones) sin IA en la nube. */
  const previewLocalList = useCallback(
    (rawText: string, fallbackDate: string | null) => {
      const trimmed = rawText.trim();
      if (!trimmed || !isMultiTaskListInput(trimmed, locale)) return null;
      const capture = applyFallbackDateToCapture(
        parseTaskCaptureLocally(trimmed, locale),
        fallbackDate,
      );
      setPreview(capture);
      return capture;
    },
    [locale],
  );

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  return {
    preview,
    isInterpreting,
    interpret,
    previewLocalList,
    clearPreview,
  };
}
