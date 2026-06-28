import { getLocalDateString } from '@/lib/dateLocal';
import { translate, type AppLocale, type TranslationKey } from '@/lib/i18n';
import type { DayTasks } from '@/hooks/useWeekTasks';
import type { WeekDayCheckIn } from '@/hooks/useWeekTasks';
import type { KoraaWeekContext, KoraaWeekDaySummary } from '@/lib/ai/types';

export type BuildKoraaWeekContextInput = {
  locale: AppLocale;
  displayName: string;
  weekStart: string;
  weekEnd: string;
  weekTasks: DayTasks[];
  checkInsByDate: Record<string, WeekDayCheckIn>;
};

function emotionLabel(emotionKey: string, locale: AppLocale): string {
  const key = emotionKey.trim().toLowerCase();
  if (!key) return '';
  return translate(locale, `sentir.emotions.${key}` as TranslationKey);
}

function mapCheckIn(
  date: string,
  checkIn: WeekDayCheckIn | undefined,
  locale: AppLocale,
): KoraaWeekDaySummary['checkIn'] | undefined {
  if (!checkIn?.emotion) return undefined;
  const emotionKey = checkIn.emotion.trim().toLowerCase();
  return {
    emotionKey,
    emotionLabel: emotionLabel(emotionKey, locale),
    energyLevel: checkIn.energy_level ?? 0,
  };
}

/** Contexto semanal para el cerebro Koraa (brief de Semana). */
export function buildKoraaWeekContext(input: BuildKoraaWeekContextInput): KoraaWeekContext | null {
  const { weekTasks, checkInsByDate, locale } = input;
  if (weekTasks.length === 0) return null;

  const todayStr = getLocalDateString();
  let openTasks = 0;
  let completedTasks = 0;
  let checkInDays = 0;
  let busiestDay: string | null = null;
  let busiestDayName: string | null = null;
  let busiestDayCount = 0;

  const days: KoraaWeekDaySummary[] = weekTasks.map(({ day, tasks }) => {
    const open = tasks.filter((task) => !task.is_completed && !task.parent_task_id);
    const done = tasks.filter((task) => task.is_completed && !task.parent_task_id);
    openTasks += open.length;
    completedTasks += done.length;

    const checkIn = mapCheckIn(day.dateStr, checkInsByDate[day.dateStr], locale);
    if (checkIn) checkInDays += 1;

    if (open.length > busiestDayCount) {
      busiestDay = day.dateStr;
      busiestDayName = day.dayName;
      busiestDayCount = open.length;
    }

    return {
      date: day.dateStr,
      dayName: day.dayName,
      openCount: open.length,
      isToday: day.isToday || day.dateStr === todayStr,
      checkIn,
    };
  });

  const todayRow = days.find((day) => day.isToday);
  const todayCheckIn = todayRow?.checkIn
    ? {
        emotionKey: todayRow.checkIn.emotionKey,
        emotionLabel: todayRow.checkIn.emotionLabel,
        energyLevel: todayRow.checkIn.energyLevel,
      }
    : undefined;

  return {
    locale: input.locale,
    displayName: input.displayName.trim() || (locale === 'en' ? 'there' : 'tú'),
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    totals: {
      openTasks,
      completedTasks,
      checkInDays,
      busiestDay,
      busiestDayName,
      busiestDayCount,
    },
    today: todayCheckIn,
    days,
  };
}
