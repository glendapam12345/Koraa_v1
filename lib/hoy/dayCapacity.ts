import type { Task } from '@/components/tasks/TaskCard';
import type { TaskPlanningMeta } from '@/lib/taskPlanningMeta';
import { estimateTaskMinutes, getAvailableMinutesFromCheckIn } from '@/lib/smartPrioritization';

export type DayCapacitySnapshot = {
  availableMinutes: number;
  plannedMinutes: number;
  stepCount: number;
  energyLevel: number;
  isOverloaded: boolean;
  /** 0 when no capacity; otherwise planned / available ratio */
  loadRatio: number;
};

export function resolveTaskPlannedMinutes(
  task: Task,
  planningMeta?: Record<string, TaskPlanningMeta>,
): number {
  const stored = planningMeta?.[task.id];
  if (stored?.estimatedMinutes && stored.estimatedMinutes > 0) {
    return stored.estimatedMinutes;
  }
  return estimateTaskMinutes(task);
}

export function buildDayCapacitySnapshot(options: {
  planTasks: Task[];
  planningMeta: Record<string, TaskPlanningMeta>;
  availableTime: string;
  energyLevel?: number;
}): DayCapacitySnapshot {
  const { planTasks, planningMeta, availableTime, energyLevel = 0 } = options;
  const openSteps = planTasks.filter((task) => !task.is_completed && !task.parent_task_id);
  const availableMinutes = getAvailableMinutesFromCheckIn(availableTime);
  const plannedMinutes = openSteps.reduce(
    (sum, task) => sum + resolveTaskPlannedMinutes(task, planningMeta),
    0,
  );

  return {
    availableMinutes,
    plannedMinutes,
    stepCount: openSteps.length,
    energyLevel,
    isOverloaded: plannedMinutes > availableMinutes,
    loadRatio: availableMinutes > 0 ? plannedMinutes / availableMinutes : 0,
  };
}
