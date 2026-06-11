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
 * Si hay pasos sugeridos (is_priority), muestra esos; si no, hasta 3 pendientes de hoy.
 */
export function getHoyFocusTasks(
  tasks: Task[],
  incompleteForToday: Task[],
  today: string = getLocalDateString(),
): Task[] {
  const hasSuggestedStepsToday = tasks.some(
    (task) =>
      !task.parent_task_id &&
      task.is_priority &&
      isTaskScheduledForToday(task, today),
  );

  const suggestedIncomplete = incompleteForToday.filter(
    (task) => !task.parent_task_id && task.is_priority,
  );

  if (hasSuggestedStepsToday) return suggestedIncomplete;

  return incompleteForToday
    .filter((task) => !task.parent_task_id)
    .slice(0, 3);
}
