import type { DayData } from '@/lib/checkInDayData';
import { getLocalDateFromISO, parseLocalDateString } from '@/lib/dateLocal';
import type { AppLocale } from '@/lib/i18n';
import { getCatalog, translate } from '@/lib/i18n';
import { getTimeOfDayPeriod, type TimeOfDayPeriod } from '@/lib/timeOfDayContext';

export type BehaviorTaskSnapshot = {
  id: string;
  is_completed: boolean;
  completed_at: string | null;
  scheduled_date: string | null;
};

export type BehaviorInsight = {
  type: 'energy' | 'emotion' | 'hour' | 'weekday' | 'open';
  message: string;
  tip: string;
};

export type PatternHoyApplyMode = 'one_step' | 'easy_first' | 'open_hoy';

export function applyModeForBehaviorType(
  type: BehaviorInsight['type'] | undefined,
): PatternHoyApplyMode {
  switch (type) {
    case 'energy':
    case 'emotion':
    case 'weekday':
      return 'one_step';
    case 'hour':
      return 'easy_first';
    case 'open':
      return 'open_hoy';
    default:
      return 'open_hoy';
  }
}

const WEEKDAY_KEYS = [
  'insights.weekdaySun',
  'insights.weekdayMon',
  'insights.weekdayTue',
  'insights.weekdayWed',
  'insights.weekdayThu',
  'insights.weekdayFri',
  'insights.weekdaySat',
] as const;

const HOUR_TIP_KEYS: Record<TimeOfDayPeriod, string> = {
  morning: 'parami.behaviorTipMorning',
  afternoon: 'parami.behaviorTipAfternoon',
  evening: 'parami.behaviorTipEvening',
  night: 'parami.behaviorTipNight',
};

const HOUR_NOTE_KEYS: Record<TimeOfDayPeriod, string> = {
  morning: 'parami.behaviorHourMorning',
  afternoon: 'parami.behaviorHourAfternoon',
  evening: 'parami.behaviorHourEvening',
  night: 'parami.behaviorHourNight',
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function formatAvg(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function emotionLabel(locale: AppLocale, emotion: string): string {
  const emotions = getCatalog(locale).sentir.emotions as Record<string, string>;
  return emotions[emotion.toLowerCase()] ?? emotion;
}

export function completionsByLocalDate(
  tasks: BehaviorTaskSnapshot[],
  startDate: string,
  endDate: string,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (!task.is_completed || !task.completed_at) continue;
    const date = getLocalDateFromISO(task.completed_at);
    if (date < startDate || date > endDate) continue;
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  return counts;
}

export function buildBehaviorInsights(
  days: DayData[],
  tasks: BehaviorTaskSnapshot[],
  locale: AppLocale,
  today: string,
): BehaviorInsight[] {
  const datedDays = days.filter((day) => Boolean(day.date));
  if (datedDays.length === 0) return [];

  const startDate = datedDays[0].date;
  const endDate = datedDays[datedDays.length - 1].date;
  const completions = completionsByLocalDate(tasks, startDate, endDate);
  const insights: BehaviorInsight[] = [];

  const checkInDays = datedDays.filter((day) => day.hasCheckIn && day.energyLevel != null);
  const highDays = checkInDays.filter((day) => (day.energyLevel ?? 0) >= 4);
  const lowDays = checkInDays.filter((day) => (day.energyLevel ?? 0) <= 2);
  const highAvg = average(highDays.map((day) => completions.get(day.date) ?? 0));
  const lowAvg = average(lowDays.map((day) => completions.get(day.date) ?? 0));

  if (highDays.length >= 1 && lowDays.length >= 1 && highAvg >= lowAvg + 0.25) {
    insights.push({
      type: 'energy',
      message: translate(locale, 'parami.behaviorEnergyMore', {
        high: formatAvg(average(highDays.map((day) => day.energyLevel ?? 0))),
        highAvg: formatAvg(highAvg),
        lowAvg: formatAvg(lowAvg),
      }),
      tip: translate(locale, 'parami.behaviorEnergyTip'),
    });
  } else if (
    highDays.length >= 1 &&
    lowDays.length >= 1 &&
    Math.abs(highAvg - lowAvg) < 0.35 &&
    highAvg + lowAvg > 0
  ) {
    insights.push({
      type: 'energy',
      message: translate(locale, 'parami.behaviorEnergySame'),
      tip: translate(locale, 'parami.behaviorEnergySameTip'),
    });
  }

  const emotionBuckets = new Map<string, number[]>();
  for (const day of checkInDays) {
    const emotion = day.emotion?.toLowerCase();
    if (!emotion) continue;
    const list = emotionBuckets.get(emotion) ?? [];
    list.push(completions.get(day.date) ?? 0);
    emotionBuckets.set(emotion, list);
  }

  let bestEmotion: { id: string; avg: number; n: number } | null = null;
  let quietEmotion: { id: string; avg: number; n: number } | null = null;
  for (const [id, values] of emotionBuckets) {
    if (values.length < 2) continue;
    const avg = average(values);
    if (!bestEmotion || avg > bestEmotion.avg) bestEmotion = { id, avg, n: values.length };
    if (!quietEmotion || avg < quietEmotion.avg) quietEmotion = { id, avg, n: values.length };
  }

  if (
    bestEmotion &&
    quietEmotion &&
    bestEmotion.id !== quietEmotion.id &&
    bestEmotion.avg >= quietEmotion.avg + 0.25
  ) {
    insights.push({
      type: 'emotion',
      message: translate(locale, 'parami.behaviorEmotionMore', {
        emotion: emotionLabel(locale, bestEmotion.id),
      }),
      tip: translate(locale, 'parami.behaviorEmotionTip'),
    });
  }

  const hourCounts: Record<TimeOfDayPeriod, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };
  let timedCompletions = 0;
  for (const task of tasks) {
    if (!task.is_completed || !task.completed_at) continue;
    const date = getLocalDateFromISO(task.completed_at);
    if (date < startDate || date > endDate) continue;
    const parsed = new Date(task.completed_at);
    if (Number.isNaN(parsed.getTime())) continue;
    hourCounts[getTimeOfDayPeriod(parsed.getHours())] += 1;
    timedCompletions += 1;
  }

  if (timedCompletions >= 3) {
    const ranked = (Object.entries(hourCounts) as [TimeOfDayPeriod, number][]).sort(
      (a, b) => b[1] - a[1],
    );
    const [topPeriod, topCount] = ranked[0];
    if (topCount >= Math.ceil(timedCompletions * 0.4)) {
      insights.push({
        type: 'hour',
        message: translate(locale, HOUR_NOTE_KEYS[topPeriod]),
        tip: translate(locale, HOUR_TIP_KEYS[topPeriod]),
      });
    }
  }

  if (checkInDays.length >= 5) {
    const weekdayEnergy = new Map<number, number[]>();
    const weekdayDone = new Map<number, number[]>();
    for (const day of checkInDays) {
      const weekday = parseLocalDateString(day.date).getDay();
      const energies = weekdayEnergy.get(weekday) ?? [];
      energies.push(day.energyLevel ?? 0);
      weekdayEnergy.set(weekday, energies);
      const dones = weekdayDone.get(weekday) ?? [];
      dones.push(completions.get(day.date) ?? 0);
      weekdayDone.set(weekday, dones);
    }

    const overallDone = average(checkInDays.map((day) => completions.get(day.date) ?? 0));
    let softWeekday = -1;
    let softEnergy = 5;
    weekdayEnergy.forEach((energies, weekday) => {
      if (energies.length < 2) return;
      const energyAvg = average(energies);
      const doneAvg = average(weekdayDone.get(weekday) ?? []);
      if (energyAvg < 3 && doneAvg <= overallDone && energyAvg < softEnergy) {
        softEnergy = energyAvg;
        softWeekday = weekday;
      }
    });

    if (softWeekday >= 0) {
      insights.push({
        type: 'weekday',
        message: translate(locale, 'parami.behaviorWeekdaySoft', {
          day: translate(locale, WEEKDAY_KEYS[softWeekday]),
        }),
        tip: translate(locale, 'parami.behaviorWeekdayTip'),
      });
    }
  }

  const openDated = tasks.filter((task) => {
    if (task.is_completed || !task.scheduled_date) return false;
    const scheduled = getLocalDateFromISO(task.scheduled_date);
    return scheduled < today && scheduled >= startDate;
  }).length;

  if (openDated >= 1) {
    insights.push({
      type: 'open',
      message: translate(locale, 'parami.behaviorOpenSteps', { open: openDated }),
      tip: translate(locale, 'parami.behaviorOpenTip'),
    });
  }

  if (insights.length === 0 && checkInDays.length >= 3) {
    const doneAvg = average(checkInDays.map((day) => completions.get(day.date) ?? 0));
    const daysWithDone = checkInDays.filter((day) => (completions.get(day.date) ?? 0) > 0).length;
    if (daysWithDone >= 1 || doneAvg > 0) {
      insights.push({
        type: 'energy',
        message: translate(locale, 'parami.behaviorRhythmSoft', {
          days: checkInDays.length,
          avg: formatAvg(doneAvg),
        }),
        tip: translate(locale, 'parami.behaviorRhythmSoftTip'),
      });
    }
  }

  return insights.slice(0, 2);
}
