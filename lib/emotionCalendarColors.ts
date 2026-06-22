import {
  getInsightsEmotionAccent,
  getInsightsEmotionFill,
} from '@/lib/insightsColors';

export function getEmotionCalendarFill(emotion?: string | null): string {
  return getInsightsEmotionFill(emotion);
}

export function getEmotionCalendarAccent(emotion?: string | null): string {
  return getInsightsEmotionAccent(emotion);
}

export const CALENDAR_EMOTION_IDS = [
  'tranquila',
  'enfocada',
  'motivada',
  'ansiosa',
  'agotada',
  'abrumada',
] as const;
