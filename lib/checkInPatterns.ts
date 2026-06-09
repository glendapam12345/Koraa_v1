import type { DayData } from '@/lib/checkInDayData';
import { getEmotionCalendarAccent } from '@/lib/emotionCalendarColors';

export type EmotionMixItem = {
  id: string;
  count: number;
  color: string;
};

/** Valores de energía (0–5) por día, en orden cronológico. Sin check-in = 0. */
export function buildEnergySparkline(days: DayData[]): number[] {
  return days.map((d) => (d.hasCheckIn && d.energyLevel ? d.energyLevel : 0));
}

/** Top emociones por frecuencia en el periodo. */
export function buildEmotionMix(days: DayData[], limit = 4): EmotionMixItem[] {
  const counts = new Map<string, number>();
  for (const day of days) {
    if (!day.emotion) continue;
    const key = day.emotion.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({
      id,
      count,
      color: getEmotionCalendarAccent(id),
    }));
}

export function hasEnoughPatternData(days: DayData[], minCheckIns = 3): boolean {
  return days.filter((d) => d.hasCheckIn).length >= minCheckIns;
}
