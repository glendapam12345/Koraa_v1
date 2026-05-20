import { DayData } from '@/components/ProgressChart';
import type { AppLocale } from '@/lib/i18n';
import { getCatalog, translate } from '@/lib/i18n';

export interface EmotionalInsight {
  type: 'pattern' | 'trend' | 'milestone';
  message: string;
  emoji?: string;
}

const WEEKDAY_INSIGHT_KEYS = [
  'insights.weekdaySun',
  'insights.weekdayMon',
  'insights.weekdayTue',
  'insights.weekdayWed',
  'insights.weekdayThu',
  'insights.weekdayFri',
  'insights.weekdaySat',
] as const;

function emotionLabel(locale: AppLocale, emotion: string): string {
  const emotions = getCatalog(locale).sentir.emotions as Record<string, string>;
  const key = emotion.toLowerCase();
  return emotions[key] ?? emotion.charAt(0).toUpperCase() + emotion.slice(1);
}

/**
 * Analiza los datos de check-ins y genera insights emocionales simples y empáticos
 */
export function generateEmotionalInsights(
  progressData: DayData[],
  currentStreak: number,
  locale: AppLocale = 'es',
): EmotionalInsight[] {
  void currentStreak;
  const insights: EmotionalInsight[] = [];

  const checkIns = progressData.filter((day) => day.hasCheckIn && day.emotion && day.energyLevel);

  if (checkIns.length === 0) {
    return [];
  }

  const emotionCounts = new Map<string, number>();
  checkIns.forEach((day) => {
    if (day.emotion) {
      emotionCounts.set(day.emotion, (emotionCounts.get(day.emotion) || 0) + 1);
    }
  });

  const mostFrequentEmotion = Array.from(emotionCounts.entries()).sort((a, b) => b[1] - a[1])[0];

  if (mostFrequentEmotion && mostFrequentEmotion[1] >= 3) {
    const label = emotionLabel(locale, mostFrequentEmotion[0]);
    insights.push({
      type: 'pattern',
      message: translate(locale, 'insights.mostlyEmotion', { emotion: label.toLowerCase() }),
      emoji: getEmotionEmoji(mostFrequentEmotion[0]),
    });
  }

  const totalEnergy = checkIns.reduce((sum, day) => sum + (day.energyLevel || 0), 0);
  const avgEnergy = totalEnergy / checkIns.length;

  if (avgEnergy >= 4) {
    insights.push({
      type: 'trend',
      message: translate(locale, 'insights.energyHigh'),
    });
  } else if (avgEnergy <= 2.5) {
    insights.push({
      type: 'trend',
      message: translate(locale, 'insights.energyLow'),
    });
  } else {
    insights.push({
      type: 'trend',
      message: translate(locale, 'insights.energyBalanced'),
    });
  }

  if (checkIns.length >= 7) {
    const dayOfWeekEnergy = new Map<number, number[]>();

    progressData.forEach((day) => {
      if (day.hasCheckIn && day.energyLevel) {
        const date = new Date(day.date);
        const dayOfWeek = date.getDay();
        if (!dayOfWeekEnergy.has(dayOfWeek)) {
          dayOfWeekEnergy.set(dayOfWeek, []);
        }
        dayOfWeekEnergy.get(dayOfWeek)!.push(day.energyLevel);
      }
    });

    let lowestEnergyDay = -1;
    let lowestEnergyAvg = 5;

    dayOfWeekEnergy.forEach((energies, dayOfWeek) => {
      if (energies.length >= 2) {
        const avg = energies.reduce((a, b) => a + b, 0) / energies.length;
        if (avg < lowestEnergyAvg) {
          lowestEnergyAvg = avg;
          lowestEnergyDay = dayOfWeek;
        }
      }
    });

    if (lowestEnergyDay !== -1 && lowestEnergyAvg < 3) {
      const dayName = translate(locale, WEEKDAY_INSIGHT_KEYS[lowestEnergyDay]);
      insights.push({
        type: 'pattern',
        message: translate(locale, 'insights.lowEnergyDay', { day: dayName }),
      });
    }
  }

  if (checkIns.length >= 7) {
    const lastWeek = checkIns.slice(-7);
    const previousWeek = checkIns.slice(-14, -7);

    if (previousWeek.length >= 3) {
      const lastWeekAvg = lastWeek.reduce((sum, d) => sum + (d.energyLevel || 0), 0) / lastWeek.length;
      const prevWeekAvg =
        previousWeek.reduce((sum, d) => sum + (d.energyLevel || 0), 0) / previousWeek.length;

      if (lastWeekAvg > prevWeekAvg + 0.5) {
        insights.push({
          type: 'trend',
          message: translate(locale, 'insights.weekMoreEnergy'),
        });
      } else if (lastWeekAvg < prevWeekAvg - 0.5) {
        insights.push({
          type: 'trend',
          message: translate(locale, 'insights.weekLessEnergy'),
        });
      }
    }
  }

  const bestDay = checkIns.reduce((best, day) => {
    if (!best || (day.energyLevel || 0) > (best.energyLevel || 0)) {
      return day;
    }
    return best;
  }, checkIns[0] as DayData | undefined);

  if (bestDay && bestDay.energyLevel === 5) {
    insights.push({
      type: 'milestone',
      message: translate(locale, 'insights.bestDay', { day: bestDay.dayLabel }),
    });
  }

  return insights.slice(0, 3);
}

export function getEmotionEmoji(emotion: string): string {
  const emotionLower = emotion.toLowerCase();
  switch (emotionLower) {
    case 'tranquila':
      return '😌';
    case 'enfocada':
      return '🎯';
    case 'motivada':
      return '✨';
    case 'ansiosa':
      return '😰';
    case 'agotada':
      return '😔';
    case 'abrumada':
      return '🥺';
    default:
      return '💭';
  }
}
