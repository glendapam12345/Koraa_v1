import { getLocalDateString } from '@/lib/dateLocal';

export function getTomorrowDateString(from: Date = new Date()): string {
  const next = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  next.setDate(next.getDate() + 1);
  return getLocalDateString(next);
}

export function getNextWeekDateString(from: Date = new Date()): string {
  const next = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  next.setDate(next.getDate() + 7);
  return getLocalDateString(next);
}
