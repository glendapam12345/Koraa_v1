import { getLocalDateString } from '@/lib/dateLocal';
import { HOY_DEFAULT_FOCUS_LIMIT } from '@/lib/hoyFocusTasks';

export type CaptureHoyEntry = {
  taskId: string;
  selectedDate?: string | null;
  markImportant?: boolean;
};

/**
 * Tras organizar en Tareas: Hoy recibe lo de hoy, lo marcado, y unos cuantos sueltos.
 * Lo que ya tiene fecha futura se queda en Calendario.
 */
export function hoyTaskIdsFromCaptureItems(
  entries: CaptureHoyEntry[],
  today: string = getLocalDateString(),
): string[] {
  const seen = new Set<string>();
  const forToday: string[] = [];
  const undated: string[] = [];

  for (const entry of entries) {
    const id = entry.taskId.trim();
    if (!id || seen.has(id)) continue;
    const date = entry.selectedDate?.trim() || null;
    if (date && date > today) continue;
    seen.add(id);
    if (date === today || entry.markImportant) {
      forToday.push(id);
    } else {
      undated.push(id);
    }
  }

  return [...forToday, ...undated.slice(0, HOY_DEFAULT_FOCUS_LIMIT)];
}
