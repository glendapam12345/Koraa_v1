import type { DayTasks, Project } from '@/hooks/useWeekTasks';
import type { Task } from '@/hooks/useTasks';
import type { AppLocale } from '@/lib/i18n';
import { getLocalDateString } from '@/lib/dateLocal';
import {
  buildWeekPlannerDays,
  type ExperienceTask,
} from '@/lib/lifeAreas/experienceDataMappers';
import { buildLifeAreaIndex } from '@/lib/lifeAreas/projectToLifeArea';
import type { LifeArea, WeekPlannerDay } from '@/lib/lifeAreas/types';
import { getStoredTaskPlanningMeta, type TaskPlanningMeta } from '@/lib/taskPlanningMeta';

function buildPlanningMap(tasks: Task[]): Record<string, TaskPlanningMeta> {
  const map: Record<string, TaskPlanningMeta> = {};
  for (const task of tasks) {
    const stored = getStoredTaskPlanningMeta(task.id);
    if (stored) map[task.id] = stored;
  }
  return map;
}

function taskToExperience(task: Task): ExperienceTask {
  return {
    id: task.id,
    content: task.content,
    project_id: task.project_id ?? null,
    scheduled_date: task.scheduled_date ?? null,
    is_completed: task.is_completed,
    is_priority: task.is_priority,
  };
}

export function buildSemanaPlannerModel(
  weekTasks: DayTasks[],
  projects: Project[],
  looseLabel: string,
  locale: AppLocale,
): { days: WeekPlannerDay[]; areas: LifeArea[] } {
  const today = getLocalDateString();
  const weekDayDates = weekTasks.map(({ day }) => day.dateStr);
  const areaIndex = buildLifeAreaIndex(projects, looseLabel);
  const areas = [...areaIndex.values()];
  const experienceTasks = weekTasks.flatMap(({ tasks }) => tasks.map(taskToExperience));
  const allTasks = weekTasks.flatMap(({ tasks }) => tasks);
  const days = buildWeekPlannerDays(
    experienceTasks,
    weekDayDates,
    today,
    areaIndex,
    locale,
    buildPlanningMap(allTasks),
  );
  return { days, areas };
}
