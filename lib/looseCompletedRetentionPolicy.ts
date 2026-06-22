/** Días que una tarea suelta completada permanece visible antes de eliminarse. */
export const LOOSE_COMPLETED_RETENTION_DAYS = 3;

const MS_PER_DAY = 86_400_000;

type LooseCompletedTiming = {
  completed_at?: string | null;
  created_at: string;
};

function completionAnchor(completedAt: string | null | undefined, createdAt: string): string {
  return completedAt?.trim() ? completedAt : createdAt;
}

export function daysSinceLooseCompleted(
  completedAt: string | null | undefined,
  createdAt: string,
): number {
  const anchor = completionAnchor(completedAt, createdAt);
  const ms = Date.now() - new Date(anchor).getTime();
  return Math.max(0, Math.floor(ms / MS_PER_DAY));
}

export function isLooseCompletedWithinRetention(task: LooseCompletedTiming): boolean {
  return (
    daysSinceLooseCompleted(task.completed_at, task.created_at) < LOOSE_COMPLETED_RETENTION_DAYS
  );
}

export function daysUntilLooseCompletedExpiry(
  completedAt: string | null | undefined,
  createdAt: string,
): number {
  const elapsed = daysSinceLooseCompleted(completedAt, createdAt);
  return Math.max(0, LOOSE_COMPLETED_RETENTION_DAYS - elapsed);
}

export function filterRetainedLooseCompletedTasks<T extends LooseCompletedTiming>(
  tasks: T[],
): T[] {
  return tasks.filter((task) => isLooseCompletedWithinRetention(task));
}
