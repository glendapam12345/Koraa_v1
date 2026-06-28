import type { DayTasks } from '@/hooks/useWeekTasks';
import type { TaskPlanningMeta } from '@/lib/taskPlanningMeta';
import { getAvailableMinutesFromCheckIn } from '@/lib/smartPrioritization';
import { resolveTaskPlannedMinutes } from '@/lib/hoy/dayCapacity';
import type { Task } from '@/components/tasks/TaskCard';

export type WeekDayLoad = {
  date: string;
  dayName: string;
  stepCount: number;
  plannedMinutes: number;
  isToday: boolean;
};

export type WeekCapacitySnapshot = {
  days: WeekDayLoad[];
  busiestDate: string | null;
  busiestDayName: string | null;
  busiestMinutes: number;
  todayAvailableMinutes: number;
  todayPlannedMinutes: number;
  isWeekImbalanced: boolean;
};

type BuildWeekCapacityOptions = {
  weekTasks: DayTasks[];
  planningMeta: Record<string, TaskPlanningMeta>;
  todayAvailableTime: string;
  /** Pasos por día antes de mover (máx. sugerido según energía de hoy). */
  maxStepsPerDay?: number;
};

export function buildWeekCapacitySnapshot({
  weekTasks,
  planningMeta,
  todayAvailableTime,
  maxStepsPerDay = 3,
}: BuildWeekCapacityOptions): WeekCapacitySnapshot | null {
  if (weekTasks.length === 0) return null;

  const todayAvailableMinutes = getAvailableMinutesFromCheckIn(todayAvailableTime);
  let busiestDate: string | null = null;
  let busiestDayName: string | null = null;
  let busiestMinutes = 0;
  let todayPlannedMinutes = 0;

  const days: WeekDayLoad[] = weekTasks.map(({ day, tasks }) => {
    const open = tasks.filter((task) => !task.is_completed && !task.parent_task_id);
    const plannedMinutes = open.reduce(
      (sum, task) => sum + resolveTaskPlannedMinutes(task as Task, planningMeta),
      0,
    );

    if (plannedMinutes > busiestMinutes) {
      busiestMinutes = plannedMinutes;
      busiestDate = day.dateStr;
      busiestDayName = day.dayName;
    }

    if (day.isToday) {
      todayPlannedMinutes = plannedMinutes;
    }

    return {
      date: day.dateStr,
      dayName: day.dayName,
      stepCount: open.length,
      plannedMinutes,
      isToday: Boolean(day.isToday),
    };
  });

  const busiestDay = days.find((day) => day.date === busiestDate);
  const isWeekImbalanced =
    Boolean(busiestDay && busiestDay.stepCount > maxStepsPerDay) ||
    todayPlannedMinutes > todayAvailableMinutes;

  return {
    days,
    busiestDate,
    busiestDayName,
    busiestMinutes,
    todayAvailableMinutes,
    todayPlannedMinutes,
    isWeekImbalanced,
  };
}
