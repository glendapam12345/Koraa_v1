import type { Task } from '@/hooks/useTasks';
import { getLocalDateString, normalizeScheduledDate } from '@/lib/dateLocal';

export function isTaskScheduledForToday(
  task: Pick<Task, 'scheduled_date'>,
  today: string = getLocalDateString(),
): boolean {
  const date = normalizeScheduledDate(task.scheduled_date);
  return !date || date === today;
}

/**
 * Pasos visibles en el panel principal de Hoy (solo pendientes — al marcar ✓ desaparecen).
 * Si hay pasos sugeridos (is_priority), muestra esos; si no, hasta 5 pendientes de hoy.
 * Con proyecto enfocado, el plan se limita a ese proyecto.
 */
export const HOY_DEFAULT_FOCUS_LIMIT = 5;

function scopeToFocusedProject<T extends Pick<Task, 'project_id'>>(
  items: T[],
  focusedProjectId?: string | null,
): T[] {
  if (!focusedProjectId) return items;
  return items.filter((item) => item.project_id === focusedProjectId);
}

export function getHoyFocusTasks(
  tasks: Task[],
  incompleteForToday: Task[],
  today: string = getLocalDateString(),
  focusedProjectId?: string | null,
): Task[] {
  const scopedIncomplete = scopeToFocusedProject(incompleteForToday, focusedProjectId);

  const hasSuggestedStepsToday = tasks.some(
    (task) =>
      !task.parent_task_id &&
      task.is_priority &&
      isTaskScheduledForToday(task, today) &&
      (!focusedProjectId || task.project_id === focusedProjectId),
  );

  const suggestedIncomplete = scopedIncomplete.filter(
    (task) => !task.parent_task_id && task.is_priority,
  );

  if (hasSuggestedStepsToday && suggestedIncomplete.length > 0) {
    return suggestedIncomplete;
  }

  return scopedIncomplete
    .filter((task) => !task.parent_task_id)
    .slice(0, HOY_DEFAULT_FOCUS_LIMIT);
}
