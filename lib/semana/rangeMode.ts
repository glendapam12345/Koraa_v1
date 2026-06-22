import { getLocalDateString, parseLocalDateString } from '@/lib/dateLocal';
import { getMonthBounds, parseMonthAnchor } from '@/lib/calendarGrid';

export type SemanaRangeMode = 'day' | 'week' | 'twoWeeks' | 'month';

export type SemanaBoardLayout = 'day' | 'weekGrid' | 'monthGrid';

export function isPremiumRangeMode(mode: SemanaRangeMode): boolean {
  return mode === 'twoWeeks' || mode === 'month';
}

export function getBoardLayout(mode: SemanaRangeMode): SemanaBoardLayout {
  if (mode === 'day') return 'day';
  if (mode === 'month') return 'monthGrid';
  return 'weekGrid';
}

export function getWeekMonday(dateStr: string): string {
  const d = parseLocalDateString(dateStr);
  const dayOfWeek = d.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + mondayOffset);
  return getLocalDateString(d);
}

/** Lunes de la semana siguiente respecto a la semana que contiene `fromDateStr`. */
export function getNextWeekMonday(fromDateStr: string): string {
  const { end } = getRangeBounds('week', fromDateStr);
  const nextMonday = parseLocalDateString(end);
  nextMonday.setDate(nextMonday.getDate() + 1);
  return getLocalDateString(nextMonday);
}

export function getRangeBounds(
  mode: SemanaRangeMode,
  anchorDate: string,
): { start: string; end: string } {
  if (mode === 'day') {
    return { start: anchorDate, end: anchorDate };
  }

  const monday = getWeekMonday(anchorDate);

  if (mode === 'week') {
    const endDate = parseLocalDateString(monday);
    endDate.setDate(endDate.getDate() + 6);
    return { start: monday, end: getLocalDateString(endDate) };
  }

  if (mode === 'twoWeeks') {
    const endDate = parseLocalDateString(monday);
    endDate.setDate(endDate.getDate() + 13);
    return { start: monday, end: getLocalDateString(endDate) };
  }

  const { year, monthIndex } = parseMonthAnchor(anchorDate);
  return getMonthBounds(year, monthIndex);
}

export function shiftAnchorDate(
  mode: SemanaRangeMode,
  anchorDate: string,
  direction: -1 | 1,
): string {
  const d = parseLocalDateString(anchorDate);

  if (mode === 'day') {
    d.setDate(d.getDate() + direction);
    return getLocalDateString(d);
  }

  if (mode === 'week' || mode === 'twoWeeks') {
    d.setDate(d.getDate() + direction * 7);
    return getLocalDateString(d);
  }

  d.setMonth(d.getMonth() + direction);
  return getLocalDateString(d);
}
