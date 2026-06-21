import { THEME } from '@/constants/theme';

const EMOTION_ACCENT: Record<string, string> = {
  tranquila: THEME.colors.chartPalette[2],
  enfocada: THEME.colors.chartPalette[3],
  motivada: THEME.colors.accent.yellow,
  ansiosa: THEME.colors.chartPalette[6],
  agotada: THEME.colors.gradient.pink,
  abrumada: THEME.colors.chartPalette[10],
};

export function getEmotionCalendarFill(emotion?: string | null): string {
  if (!emotion) return THEME.colors.calm.mist;
  const key = emotion.toLowerCase();
  return (
    THEME.colors.emotionTint[key as keyof typeof THEME.colors.emotionTint] ??
    THEME.colors.emotionTint.default
  );
}

export function getEmotionCalendarAccent(emotion?: string | null): string {
  if (!emotion) return THEME.colors.calm.border;
  const key = emotion.toLowerCase();
  return EMOTION_ACCENT[key] ?? THEME.colors.gradient.blue;
}

export const CALENDAR_EMOTION_IDS = [
  'tranquila',
  'enfocada',
  'motivada',
  'ansiosa',
  'agotada',
  'abrumada',
] as const;
