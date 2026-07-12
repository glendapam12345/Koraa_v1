import type { Task } from '@/hooks/useTasks';
import { getLocalDateString, normalizeScheduledDate } from '@/lib/dateLocal';
import type { HoyProjectInfo } from '@/lib/hoy/focusTaskDisplay';

/** Solo 1 paso usa el encuadre "si solo puedes con una cosa"; 2+ → "tiene fecha hoy". */
export const HOY_ONE_THING_MAX = 1;

/**
 * Paso con fecha hoy, vencido o proyecto que vence hoy — conviene no posponer.
 */
export function isHoyTimeSensitiveTask(
  task: Pick<Task, 'scheduled_date' | 'project_id'>,
  project: HoyProjectInfo | undefined,
  today: string = getLocalDateString(),
): boolean {
  const scheduled = normalizeScheduledDate(task.scheduled_date);
  if (scheduled) {
    return scheduled <= today;
  }

  const projectDue = normalizeScheduledDate(project?.due_date);
  if (!projectDue) return false;

  return projectDue <= today;
}

export type SplitHoyPriorityResult = {
  pinned: Task[];
  flexible: Task[];
  /** Exactamente 1 paso con fecha — copy "si solo puedes con una cosa". */
  useOneThingFraming: boolean;
};

export function splitHoyPriorityTasks(
  tasks: Task[],
  projectsMap: Record<string, HoyProjectInfo | undefined>,
  today: string = getLocalDateString(),
): SplitHoyPriorityResult {
  const pinned: Task[] = [];
  const flexible: Task[] = [];

  for (const task of tasks) {
    const project = task.project_id ? projectsMap[task.project_id] : undefined;
    if (isHoyTimeSensitiveTask(task, project, today)) {
      pinned.push(task);
    } else {
      flexible.push(task);
    }
  }

  return {
    pinned,
    flexible,
    useOneThingFraming: pinned.length === HOY_ONE_THING_MAX,
  };
}
