import { THEME } from '@/constants/theme';

/** Energy bar colors — green (high) → yellow → orange → coral (low). */
export const INSIGHTS_ENERGY_COLORS = {
  1: '#FF7B45',
  2: '#FFB045',
  3: '#FFD93D',
  4: '#76D672',
  5: '#52C9A2',
} as const;

export type InsightsEnergyLevel = keyof typeof INSIGHTS_ENERGY_COLORS;

export function getEnergyLevelColor(level: number | null | undefined): string {
  if (level == null || level < 1) return THEME.colors.calm.mist;
  const clamped = Math.min(5, Math.max(1, Math.round(level))) as InsightsEnergyLevel;
  return INSIGHTS_ENERGY_COLORS[clamped];
}

/** Accent borders / highlights for mood timeline & emotion mix. */
export const INSIGHTS_EMOTION_ACCENTS: Record<string, string> = {
  tranquila: '#76D672',
  enfocada: '#52C9A2',
  motivada: '#FFD93D',
  ansiosa: '#FFB045',
  agotada: '#6BB6FF',
  abrumada: '#FF7B45',
};

export function getInsightsEmotionAccent(emotion?: string | null): string {
  if (!emotion) return THEME.colors.calm.border;
  const key = emotion.toLowerCase();
  return INSIGHTS_EMOTION_ACCENTS[key] ?? THEME.colors.calm.lavenderDeep;
}

/** Soft fill behind mood emoji cells. */
export const INSIGHTS_EMOTION_FILLS: Record<string, string> = {
  tranquila: 'rgba(118, 214, 114, 0.28)',
  enfocada: 'rgba(82, 201, 162, 0.28)',
  motivada: 'rgba(255, 217, 61, 0.32)',
  ansiosa: 'rgba(255, 176, 69, 0.28)',
  agotada: 'rgba(107, 182, 255, 0.28)',
  abrumada: 'rgba(255, 123, 69, 0.28)',
};

export function getInsightsEmotionFill(emotion?: string | null): string {
  if (!emotion) return THEME.colors.surfaceOverlay.veryFaint;
  const key = emotion.toLowerCase();
  return INSIGHTS_EMOTION_FILLS[key] ?? 'rgba(124, 92, 224, 0.12)';
}
