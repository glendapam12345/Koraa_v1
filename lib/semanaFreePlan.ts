import type { DayTasks } from '@/hooks/useWeekTasks';

export const FREE_CALENDAR_VISIBLE_DAYS = 3;

/**
 * Plan gratis: muestra hasta N días de la semana actual, priorizando hoy y los siguientes.
 * Evita mostrar solo lun–mié cuando hoy es vie o sáb.
 */
export function getFreeVisibleWeekTasks(
  weekTasks: DayTasks[],
  maxDays = FREE_CALENDAR_VISIBLE_DAYS,
): { visible: DayTasks[]; hiddenCount: number } {
  if (weekTasks.length <= maxDays) {
    return { visible: weekTasks, hiddenCount: 0 };
  }

  const todayIndex = weekTasks.findIndex(({ day }) => day.isToday);
  const startIndex =
    todayIndex >= 0
      ? Math.max(0, Math.min(todayIndex, weekTasks.length - maxDays))
      : 0;

  const visible = weekTasks.slice(startIndex, startIndex + maxDays);
  return { visible, hiddenCount: weekTasks.length - visible.length };
}
