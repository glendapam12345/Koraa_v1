import type { Task } from '@/hooks/useTasks';
import { getLocalDateFromISO, getLocalDateString } from '@/lib/dateLocal';
import { isTaskScheduledForToday } from '@/lib/hoyFocusTasks';

export function isPriorityCompletedToday(task: Task, today: string = getLocalDateString()): boolean {
  if (!task.is_priority || !task.is_completed || !task.completed_at) return false;
  return getLocalDateFromISO(String(task.completed_at)) === today;
}

/** Pasos sugeridos para hoy (misma ventana que el plan en Hoy). */
export function getTodayPriorityStats(tasks: Task[], today: string = getLocalDateString()) {
  const focusTasks = tasks.filter(
    (t) => t.is_priority && !t.parent_task_id && isTaskScheduledForToday(t, today),
  );
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
