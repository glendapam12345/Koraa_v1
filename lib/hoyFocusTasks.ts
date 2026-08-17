import type { Task } from '@/hooks/useTasks';
import { getLocalDateString, normalizeScheduledDate } from '@/lib/dateLocal';

/** Legacy: sin fecha cuenta como “hoy” (captura / foco antiguo). */
export function isTaskScheduledForToday(
  task: Pick<Task, 'scheduled_date'>,
  today: string = getLocalDateString(),
): boolean {
  const date = normalizeScheduledDate(task.scheduled_date);
  return !date || date === today;
}

/** Tarea con fecha explícita para hoy. */
export function isTaskExplicitlyForToday(
  task: Pick<Task, 'scheduled_date'>,
  today: string = getLocalDateString(),
): boolean {
  return normalizeScheduledDate(task.scheduled_date) === today;
}

/**
 * Paso sugerido en Hoy: fecha de hoy (deadline) o marcada como paso de hoy.
 * Las sueltas sin fecha ni prioridad viven en Áreas, no en Hoy.
 */
export function isTaskSuggestedForToday(
  task: Pick<Task, 'scheduled_date' | 'is_priority'>,
  today: string = getLocalDateString(),
): boolean {
  const date = normalizeScheduledDate(task.scheduled_date);
  if (date === today) return true;
  if (!task.is_priority) return false;
  return !date;
}

/**
 * Puede esperar hoy: fecha hoy, aún pendiente, y no entra como paso sugerido.
 * Con deadlines de hoy en el plan, esto queda para overflow de UI.
 */
export function isTaskWaitingForToday(
  task: Pick<Task, 'scheduled_date' | 'is_priority' | 'is_completed'>,
  today: string = getLocalDateString(),
): boolean {
  if (task.is_completed) return false;
  if (isTaskSuggestedForToday(task, today)) return false;
  return isTaskExplicitlyForToday(task, today);
}

/** Máx. pasos visibles como foco principal en Hoy (mock: 1 decisión). */
export const HOY_DEFAULT_FOCUS_LIMIT = 1;

function scopeToFocusedProject<T extends Pick<Task, 'project_id'>>(
  items: T[],
  focusedProjectId?: string | null,
): T[] {
  if (!focusedProjectId) return items;
  return items.filter((item) => item.project_id === focusedProjectId);
}

function sortHoyPlanTasks(a: Task, b: Task): number {
  if (a.is_priority !== b.is_priority) {
    return a.is_priority ? -1 : 1;
  }
  return 0;
}

function basePlanFilter(
  task: Task,
  today: string,
  focusedProjectId?: string | null,
): boolean {
  if (task.parent_task_id) return false;
  if (task.is_completed) return false;
  if (focusedProjectId && task.project_id !== focusedProjectId) return false;
  return isTaskSuggestedForToday(task, today) || isTaskWaitingForToday(task, today);
}

/** Pasos pendientes del plan de hoy (sugeridos + pueden esperar). */
export function getHoyTodayPlanTasks(
  tasks: Task[],
  today: string = getLocalDateString(),
  focusedProjectId?: string | null,
): Task[] {
  return tasks
    .filter((task) => basePlanFilter(task, today, focusedProjectId))
    .sort(sortHoyPlanTasks);
}

export function getHoyFocusTasks(
  tasks: Task[],
  incompleteForToday: Task[],
  today: string = getLocalDateString(),
  focusedProjectId?: string | null,
): Task[] {
  const scopedIncomplete = scopeToFocusedProject(incompleteForToday, focusedProjectId).filter(
    (task) => !task.parent_task_id,
  );

  return scopedIncomplete
    .filter((task) => isTaskSuggestedForToday(task, today))
    .sort(sortHoyPlanTasks);
}

/** Pasos sugeridos pendientes para hoy. */
export function getHoyPriorityPlanTasks(
  tasks: Task[],
  today: string = getLocalDateString(),
  focusedProjectId?: string | null,
): Task[] {
  return tasks
    .filter(
      (task) =>
        !task.parent_task_id &&
        !task.is_completed &&
        isTaskSuggestedForToday(task, today) &&
        (!focusedProjectId || task.project_id === focusedProjectId),
    )
    .sort(sortHoyPlanTasks);
}

/** Pasos de hoy que pueden esperar (fecha hoy, sin prioridad, pendientes). */
export function getHoyWaitingPlanTasks(
  tasks: Task[],
  today: string = getLocalDateString(),
  focusedProjectId?: string | null,
): Task[] {
  return tasks
    .filter(
      (task) =>
        !task.parent_task_id &&
        isTaskWaitingForToday(task, today) &&
        (!focusedProjectId || task.project_id === focusedProjectId),
    )
    .sort(sortHoyPlanTasks);
}
