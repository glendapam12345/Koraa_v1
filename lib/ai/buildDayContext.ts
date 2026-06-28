import { getLocalDateString } from '@/lib/dateLocal';
import type { AppLocale } from '@/lib/i18n';
import type { KoraaDayContext, KoraaDayContextFocusTask } from '@/lib/ai/types';

export type BuildKoraaDayContextInput = {
  locale: AppLocale;
  displayName: string;
  todayMood: string | null;
  todayEmotionLabel: string;
  energyLevel: number;
  availableTime: string;
  focusLevel: string;
  suggestion: string;
  focusCount: number;
  focusTasks: KoraaDayContextFocusTask[];
  pendingCount: number;
  date?: string;
};

/** Contexto unificado del día para coach + consejos (Fase 2 cerebro Koraa). */
export function buildKoraaDayContext(input: BuildKoraaDayContextInput): KoraaDayContext | null {
  const emotionKey = input.todayMood?.trim().toLowerCase() ?? '';
  if (!emotionKey || input.energyLevel <= 0) return null;

  return {
    locale: input.locale,
    date: input.date ?? getLocalDateString(),
    displayName: input.displayName.trim() || (input.locale === 'en' ? 'there' : 'tú'),
    checkIn: {
      emotionKey,
      emotionLabel: input.todayEmotionLabel.trim() || emotionKey,
      energyLevel: input.energyLevel,
      availableTime: input.availableTime.trim(),
      focusLevel: input.focusLevel.trim(),
    },
    plan: {
      suggestion: input.suggestion.trim(),
      focusCount: Math.max(0, input.focusCount),
      focusTasks: input.focusTasks.slice(0, 5).map((task) => ({
        id: task.id,
        content: task.content.trim().slice(0, 120),
      })),
      pendingCount: Math.max(0, input.pendingCount),
    },
  };
}
