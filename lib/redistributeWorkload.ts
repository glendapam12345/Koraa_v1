/**
 * Reparte tareas en el calendario hasta una fecha de entrega,
 * respetando un máximo aproximado de tareas por día (energía / tiempo / emoción).
 */

import type { AppLocale } from '@/lib/i18n';
import { translate } from '@/lib/i18n';
import { toISODateLocal } from '@/lib/dateLocal';

export function parseISODateOnly(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function enumerateDaysInclusive(start: Date, end: Date): string[] {
  const out: string[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endNorm = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= endNorm) {
    out.push(toISODateLocal(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export type RedistributionResult = {
  assignments: { id: string; scheduled_date: string }[];
  warning?: string;
};

/**
 * Reparte taskIds en orden en los días [today, dueDate], hasta `maxPerDay` por día
 * excepto el último día, que absorbe el resto (todo listo para la entrega).
 */
export function redistributeTaskDates(
  taskIds: string[],
  dueDateStr: string,
  todayStr: string,
  maxPerDay: number,
  locale: AppLocale = 'es',
): RedistributionResult {
  const due = parseISODateOnly(dueDateStr);
  const today = parseISODateOnly(todayStr);
  if (!due || !today) {
    return {
      assignments: [],
      warning: translate(locale, 'redistribute.warningInvalidDate'),
    };
  }
  if (due < today) {
    return {
      assignments: [],
      warning: translate(locale, 'redistribute.warningDueBeforeToday'),
    };
  }

  const days = enumerateDaysInclusive(today, due);
  const n = taskIds.length;
  if (n === 0) return { assignments: [] };

  const dCount = days.length;
  const minDaysNeeded = Math.ceil(n / Math.max(1, maxPerDay));
  let warning: string | undefined;
  if (minDaysNeeded > dCount) {
    warning = translate(locale, 'redistribute.warningOverload', {
      count: n,
      maxPerDay,
      dayCount: dCount,
    });
  }

  const assignments: { id: string; scheduled_date: string }[] = [];
  let taskIdx = 0;
  for (let di = 0; di < days.length && taskIdx < n; di++) {
    const isLast = di === days.length - 1;
    const remaining = n - taskIdx;
    const take = isLast ? remaining : Math.min(maxPerDay, remaining);
    for (let j = 0; j < take; j++) {
      assignments.push({ id: taskIds[taskIdx++], scheduled_date: days[di] });
    }
  }
  return { assignments, warning };
}

/** Reparte tareas sueltas en los próximos `horizonDays` días (incluye hoy). */
export function redistributeLooseTasks(
  taskIds: string[],
  horizonDays: number,
  todayStr: string,
  maxPerDay: number,
  locale: AppLocale = 'es',
): RedistributionResult {
  const today = parseISODateOnly(todayStr);
  if (!today) {
    return {
      assignments: [],
      warning: translate(locale, 'redistribute.warningInvalidToday'),
    };
  }
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  end.setDate(end.getDate() + Math.max(1, horizonDays) - 1);
  const dueStr = toISODateLocal(end);
  return redistributeTaskDates(taskIds, dueStr, todayStr, maxPerDay, locale);
}
