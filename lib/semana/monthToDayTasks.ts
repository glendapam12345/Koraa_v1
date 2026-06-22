import type { CalendarDayData } from '@/hooks/useMonthCalendar';
import type { DayTasks, WeekDay } from '@/hooks/useWeekTasks';
import type { Task } from '@/hooks/useTasks';
import type { AppLocale } from '@/lib/i18n';
import { translate } from '@/lib/i18n';
import { getLocalDateString } from '@/lib/dateLocal';

function weekdayName(dateStr: string, locale: AppLocale): string {
  const d = new Date(`${dateStr}T12:00:00`);
  const index = (d.getDay() + 6) % 7;
  const keys = [
    'semana.weekdayMon',
    'semana.weekdayTue',
    'semana.weekdayWed',
    'semana.weekdayThu',
    'semana.weekdayFri',
    'semana.weekdaySat',
    'semana.weekdaySun',
  ] as const;
  return translate(locale, keys[index]);
}

export function monthCalendarToDayTasks(
  calendarDays: CalendarDayData[],
  tasksByDate: Record<string, Task[]>,
  locale: AppLocale,
): DayTasks[] {
  const today = getLocalDateString();

  return calendarDays
    .filter((cell) => cell.inCurrentMonth)
    .map((cell): DayTasks => {
      const day: WeekDay = {
        dateStr: cell.dateStr,
        label: `${weekdayName(cell.dateStr, locale)} ${cell.dayNumber}`,
        dayName: weekdayName(cell.dateStr, locale),
        isToday: cell.dateStr === today,
      };
      return {
        day,
        tasks: tasksByDate[cell.dateStr] ?? [],
      };
    });
}
