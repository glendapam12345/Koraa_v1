import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { interpretTaskCapture } from '@/lib/taskCaptureAi';
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
    async (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed) return null;
      setIsInterpreting(true);
      try {
        const result = await interpretTaskCapture(user?.id, {
          rawText: trimmed,
          locale,
          energyLevel,
          emotionKey,
        });
        setPreview(result);
        return result;
      } finally {
        setIsInterpreting(false);
      }
    },
    [emotionKey, energyLevel, locale, user?.id],
  );

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  return {
    preview,
    isInterpreting,
    interpret,
    clearPreview,
  };
}
