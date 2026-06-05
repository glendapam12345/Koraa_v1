import type { TranslationKey } from '@/lib/i18n';

export type EmotionalMemoryInsight = {
  title: string;
  message: string;
  tip: string;
};

type CheckInRow = {
  date: string;
  energy_level: number | null;
  emotion: string | null;
};

type TranslateFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

export function buildHoyEmotionalMemoryInsights(
  rows: CheckInRow[],
  t: TranslateFn,
): EmotionalMemoryInsight[] {
  if (rows.length < 4) return [];

  const dayNames = [
    t('insights.weekdaySun'),
    t('insights.weekdayMon'),
    t('insights.weekdayTue'),
    t('insights.weekdayWed'),
    t('insights.weekdayThu'),
    t('insights.weekdayFri'),
    t('insights.weekdaySat'),
  ];
  const byDay = new Map<number, number[]>();
  const emotionCounts = new Map<string, number>();

  rows.forEach((item) => {
    const dt = new Date(item.date);
    const day = dt.getDay();
    const energy = typeof item.energy_level === 'number' ? item.energy_level : null;
    if (energy !== null) {
      byDay.set(day, [...(byDay.get(day) ?? []), energy]);
    }
    if (item.emotion) {
      const key = item.emotion.toLowerCase();
      emotionCounts.set(key, (emotionCounts.get(key) ?? 0) + 1);
    }
  });

  let lowestDay = -1;
  let lowestAvg = Number.POSITIVE_INFINITY;
  let highestDay = -1;
  let highestAvg = Number.NEGATIVE_INFINITY;

  byDay.forEach((energies, day) => {
    if (energies.length < 2) return;
    const avg = energies.reduce((sum, val) => sum + val, 0) / energies.length;
    if (avg < lowestAvg) {
      lowestAvg = avg;
      lowestDay = day;
    }
    if (avg > highestAvg) {
      highestAvg = avg;
      highestDay = day;
    }
  });

  const topEmotionEntry = Array.from(emotionCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  const topEmotion = topEmotionEntry ? topEmotionEntry[0] : null;

  const insights: EmotionalMemoryInsight[] = [];

  if (lowestDay !== -1 && lowestAvg <= 3.2) {
    insights.push({
      title: t('hoy.emotionalMemory'),
      message: t('hoyMemory.lowEnergyMessage', { day: dayNames[lowestDay] }),
      tip: t('hoyMemory.lowEnergyTip', {
        emotionSuffix: topEmotion
          ? t('hoyMemory.lowEnergyTipEmotion', { emotion: topEmotion })
          : '',
      }),
    });
  }

  if (highestDay !== -1 && highestAvg >= 4) {
    insights.push({
      title: t('hoy.emotionalMemory'),
      message: t('hoyMemory.highEnergyMessage', { day: dayNames[highestDay] }),
      tip: t('hoy.memoryTipDeep'),
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: t('hoy.emotionalMemory'),
      message: t('hoy.memoryMsgVariable'),
      tip: t('hoy.memoryTipRealtime'),
    });
  }

  if (topEmotion && !insights.some((i) => i.message.includes(topEmotion))) {
    insights.push({
      title: t('hoy.emotionalMemory'),
      message: t('hoyMemory.topEmotionMessage', { emotion: topEmotion }),
      tip: t('hoy.memoryTipFriction'),
    });
  }

  return insights.slice(0, 3);
}
