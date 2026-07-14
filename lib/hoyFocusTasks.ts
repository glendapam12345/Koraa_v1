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
 * Paso sugerido en Hoy: prioridad y (fecha hoy o sin fecha pero marcada prioridad).
 * Las tareas sueltas sin fecha ni prioridad viven en Áreas, no en Hoy.
 */
export function isTaskSuggestedForToday(
  task: Pick<Task, 'scheduled_date' | 'is_priority'>,
  today: string = getLocalDateString(),
): boolean {
  if (!task.is_priority) return false;
  const date = normalizeScheduledDate(task.scheduled_date);
  if (!date) return true;
  return date === today;
}

/**
 * Puede esperar hoy: en el plan de hoy, sin prioridad, aún pendiente.
 */
export function isTaskWaitingForToday(
  task: Pick<Task, 'scheduled_date' | 'is_priority' | 'is_completed'>,
  today: string = getLocalDateString(),
): boolean {
  if (task.is_completed || task.is_priority) return false;
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

  const priorityIncomplete = scopedIncomplete
    .filter((task) => isTaskSuggestedForToday(task, today))
    .sort(sortHoyPlanTasks);

  if (priorityIncomplete.length > 0) {
    return priorityIncomplete;
  }

  return scopedIncomplete
    .filter((task) => isTaskExplicitlyForToday(task, today) || !normalizeScheduledDate(task.scheduled_date))
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
