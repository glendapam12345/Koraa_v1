import { getLocalDateString, parseLocalDateString } from '@/lib/dateLocal';
import type { AppLocale } from '@/lib/i18n';
import type { ExperienceTask } from '@/lib/lifeAreas/experienceDataMappers';

export type MonthLoadLevel = 'none' | 'light' | 'medium' | 'full';

export type MonthPlannerCell = {
  date: string;
  dayNumber: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  taskCount: number;
  loadLevel: MonthLoadLevel;
};

export type MonthPlannerModel = {
  monthLabel: string;
  weekdayHeaders: string[];
  weeks: MonthPlannerCell[][];
};

function loadLevel(count: number): MonthLoadLevel {
  if (count === 0) return 'none';
  if (count <= 2) return 'light';
  if (count <= 4) return 'medium';
  return 'full';
}

function monthLabel(date: Date, locale: AppLocale): string {
  return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', {
    month: 'long',
    year: 'numeric',
  });
}

function weekdayHeaders(locale: AppLocale): string[] {
  const formatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-MX', {
    weekday: 'narrow',
  });
  const monday = new Date(2024, 0, 1);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return formatter.format(day).replace('.', '').toUpperCase();
  });
}

export function buildMonthPlannerModel(
  tasks: ExperienceTask[],
  anchorDate: string = getLocalDateString(),
  locale: AppLocale = 'es',
): MonthPlannerModel {
  const anchor = parseLocalDateString(anchorDate);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const today = getLocalDateString();

  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (task.is_completed || !task.scheduled_date) continue;
    counts.set(task.scheduled_date, (counts.get(task.scheduled_date) ?? 0) + 1);
  }

  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;
  const gridStart = new Date(year, month, 1 - startOffset);

  const weeks: MonthPlannerCell[][] = [];
  let cursor = new Date(gridStart);

  for (let week = 0; week < 6; week += 1) {
    const row: MonthPlannerCell[] = [];
    for (let day = 0; day < 7; day += 1) {
      const dateStr = getLocalDateString(cursor);
      const taskCount = counts.get(dateStr) ?? 0;
      row.push({
        date: dateStr,
        dayNumber: cursor.getDate(),
        isToday: dateStr === today,
        isCurrentMonth: cursor.getMonth() === month,
        taskCount,
        loadLevel: loadLevel(taskCount),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(row);
  }

  return {
    monthLabel: monthLabel(anchor, locale),
    weekdayHeaders: weekdayHeaders(locale),
    weeks,
  };
}
