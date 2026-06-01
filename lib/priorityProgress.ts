import type { Task } from '@/hooks/useTasks';
import { getLocalDateString } from '@/lib/dateLocal';

export function isPriorityCompletedToday(task: Task, today: string = getLocalDateString()): boolean {
  if (!task.is_priority || !task.is_completed || !task.completed_at) return false;
  return String(task.completed_at).slice(0, 10) === today;
}

/** Tareas marcadas como foco del día (pendientes o completadas hoy). */
export function getTodayPriorityStats(tasks: Task[], today: string = getLocalDateString()) {
  const focusTasks = tasks.filter((t) => t.is_priority && !t.parent_task_id);
  const done = focusTasks.filter((t) => isPriorityCompletedToday(t, today)).length;
  const total = focusTasks.filter(
    (t) => !t.is_completed || isPriorityCompletedToday(t, today),
  ).length;
  return {
    done,
    total,
    pending: Math.max(total - done, 0),
    ratio: total > 0 ? done / total : 0,
  };
}

export function countPriorityCompletedBefore(
  tasks: Task[],
  excludeTaskId: string,
  today: string = getLocalDateString(),
): number {
  return tasks.filter(
    (t) =>
      t.id !== excludeTaskId &&
      t.is_priority &&
      !t.parent_task_id &&
      isPriorityCompletedToday(t, today),
  ).length;
}
