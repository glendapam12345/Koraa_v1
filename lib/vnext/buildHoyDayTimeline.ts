import type { Task } from '@/components/tasks/TaskCard';
import type { AppLocale } from '@/lib/i18n';
import { getLocalDateString } from '@/lib/dateLocal';
import {
  buildDayTimeline,
  buildWeekPlannerDays,
  type ExperienceTask,
} from '@/lib/lifeAreas/experienceDataMappers';
import { buildLifeAreaIndex } from '@/lib/lifeAreas/projectToLifeArea';
import type { DayTimelineModel } from '@/lib/lifeAreas/types';
import { getAvailableMinutesFromCheckIn } from '@/lib/smartPrioritization';

export type HoyDayTimelineResult = {
  model: DayTimelineModel;
  focusLabel?: string;
  availableHoursLabel?: string;
  taskCount: number;
};

export function formatCheckInHoursLabel(availableTime: string): string {
  const minutes = getAvailableMinutesFromCheckIn(availableTime);
  const hours = Math.round(minutes / 60);
  if (hours >= 8) return '8+ h';
  return `${hours} h`;
}

function sortTimelineTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1;
    return a.created_at.localeCompare(b.created_at);
  });
}

export function pickHoyTimelineTasks(
  incompleteForToday: Task[],
  focusTasks: Task[],
  maxTasks = 8,
): Task[] {
  const parents = incompleteForToday.filter((task) => !task.parent_task_id);
  const focusIds = new Set(focusTasks.map((task) => task.id));
  const focusOrdered = sortTimelineTasks(parents.filter((task) => focusIds.has(task.id)));
  const rest = sortTimelineTasks(parents.filter((task) => !focusIds.has(task.id)));
  return [...focusOrdered, ...rest].slice(0, maxTasks);
}

export function buildHoyDayTimeline(
  timelineTasks: Task[],
  projects: { id: string; name: string; color?: string | null }[],
  locale: AppLocale,
  looseLabel: string,
  options?: {
    focusLabel?: string;
    availableTime?: string;
  },
): HoyDayTimelineResult | null {
  if (timelineTasks.length === 0) return null;

  const today = getLocalDateString();
  const experienceTasks: ExperienceTask[] = timelineTasks.map((task) => ({
    id: task.id,
    content: task.content,
    project_id: task.project_id ?? null,
    scheduled_date: today,
    is_completed: false,
    is_priority: task.is_priority,
  }));

  const areaIndex = buildLifeAreaIndex(
    projects.map((project) => ({
      id: project.id,
      name: project.name,
      color: project.color ?? null,
    })),
    looseLabel,
  );

  const [todayDay] = buildWeekPlannerDays(
    experienceTasks,
    [today],
    today,
    areaIndex,
    locale,
  );

  if (!todayDay || todayDay.tasks.length === 0) return null;

  const model = buildDayTimeline(todayDay, areaIndex, locale);

  return {
    model,
    focusLabel: options?.focusLabel,
    availableHoursLabel: options?.availableTime
      ? formatCheckInHoursLabel(options.availableTime)
      : undefined,
    taskCount: todayDay.tasks.length,
  };
}
