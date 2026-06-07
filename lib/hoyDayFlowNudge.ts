/** Hora local a partir de la cual puede mostrarse el nudge «focos sin marcar». */
export const HOY_NOTHING_DONE_MIN_HOUR = 14;

export function isHoyAfternoonNudgeWindow(now: Date = new Date()): boolean {
  return now.getHours() >= HOY_NOTHING_DONE_MIN_HOUR;
}
