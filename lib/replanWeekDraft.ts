import type { DayTasks } from '@/hooks/useWeekTasks';
import type { Task } from '@/hooks/useTasks';

export function applyAssignmentsToWeekTasks(
  weekTasks: DayTasks[],
  assignments: { id: string; scheduled_date: string }[],
): DayTasks[] {
  if (assignments.length === 0) return weekTasks;

  const assignmentMap = new Map(assignments.map((entry) => [entry.id, entry.scheduled_date]));
  const dateToIndex = new Map(weekTasks.map((entry, index) => [entry.day.dateStr, index]));
  const next = weekTasks.map((entry) => ({ day: entry.day, tasks: [] as Task[] }));

  for (const { day, tasks } of weekTasks) {
    for (const task of tasks) {
      const targetDate = assignmentMap.get(task.id) ?? task.scheduled_date ?? day.dateStr;
      const targetIndex = dateToIndex.get(targetDate) ?? dateToIndex.get(day.dateStr);
      if (targetIndex == null) continue;
      next[targetIndex].tasks.push({ ...task, scheduled_date: targetDate });
    }
  }

  return next;
}

export function moveTaskInWeekDraft(
  weekTasks: DayTasks[],
  taskId: string,
  targetDayId: string,
): DayTasks[] {
  let movingTask: Task | null = null;

  const stripped = weekTasks.map((entry) => ({
    day: entry.day,
    tasks: entry.tasks.filter((task) => {
      if (task.id !== taskId) return true;
      movingTask = { ...task, scheduled_date: targetDayId };
      return false;
    }),
  }));

  if (!movingTask) return weekTasks;

  return stripped.map((entry) =>
    entry.day.dateStr === targetDayId
      ? { ...entry, tasks: [...entry.tasks, movingTask as Task] }
      : entry,
  );
}

export function extractAssignmentsFromWeekDraft(
  weekTasks: DayTasks[],
): { id: string; scheduled_date: string }[] {
  const assignments: { id: string; scheduled_date: string }[] = [];
  for (const { day, tasks } of weekTasks) {
    for (const task of tasks) {
      assignments.push({ id: task.id, scheduled_date: day.dateStr });
    }
  }
  return assignments;
}
