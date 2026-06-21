import type { Task } from '@/components/tasks/TaskCard';
import type { AppLocale } from '@/lib/i18n';
import { getLocalDateString, normalizeScheduledDate } from '@/lib/dateLocal';
import {
  lifeAreaCatalogEntry,
  resolveProjectLifeAreaKey,
  type LifeAreaKey,
} from '@/lib/lifeAreas/lifeAreaCatalog';
import {
  computeProjectProgress,
  daysUntilDue,
  formatProjectDueDate,
  type ProjectProgress,
} from '@/lib/projectProgress';
import {
  effortToDefaultMinutes,
  formatDurationLabel,
  getTaskPlanningMeta,
  type TaskPlanningMeta,
} from '@/lib/taskPlanningMeta';

export type ProjectProgressMap = Record<string, ProjectProgress>;

export type HoyProjectInfo = {
  name: string;
  color?: string;
  due_date?: string | null;
  life_area_key?: string | null;
};

export type FocusTaskDeadline = {
  label: string;
  urgent: boolean;
};

export function buildProjectProgressMap(tasks: Task[]): ProjectProgressMap {
  const counts = new Map<string, { total: number; incomplete: number }>();

  for (const task of tasks) {
    if (!task.project_id || task.parent_task_id) continue;
    const current = counts.get(task.project_id) ?? { total: 0, incomplete: 0 };
    current.total += 1;
    if (!task.is_completed) current.incomplete += 1;
    counts.set(task.project_id, current);
  }

  return Object.fromEntries(
    [...counts.entries()].map(([projectId, entry]) => [
      projectId,
      computeProjectProgress(entry.total, entry.incomplete),
    ]),
  );
}

export function getFocusTaskEstimatedMinutes(
  task: Task,
  planningMeta?: TaskPlanningMeta,
): number {
  const meta = planningMeta ?? getTaskPlanningMeta(task.id);
  if (meta.estimatedMinutes > 0) return meta.estimatedMinutes;
  return effortToDefaultMinutes(task.perceivedEffort);
}

export function formatFocusTaskDuration(minutes: number): string {
  return formatDurationLabel(minutes);
}

export function buildFocusTaskDeadline(
  task: Task,
  project: HoyProjectInfo | undefined,
  locale: AppLocale,
  t: (key: string, params?: Record<string, string | number>) => string,
): FocusTaskDeadline | null {
  const today = getLocalDateString();
  const scheduled = normalizeScheduledDate(task.scheduled_date);

  if (scheduled) {
    const days = daysUntilDue(scheduled);
    const formatted = formatProjectDueDate(scheduled, locale);
    if (!formatted) return null;
    const label =
      scheduled === today
        ? t('hoy.focusTaskDeadlineToday')
        : t('hoy.focusTaskDeadline', { date: formatted });
    return {
      label,
      urgent: days !== null && days <= 2,
    };
  }

  const projectDue = project?.due_date?.trim();
  if (projectDue) {
    const days = daysUntilDue(projectDue);
    const formatted = formatProjectDueDate(projectDue, locale);
    if (!formatted) return null;
    return {
      label: t('hoy.focusTaskProjectDeadline', { date: formatted }),
      urgent: days !== null && days <= 3,
    };
  }

  return null;
}

export function resolveFocusTaskAreaLabel(
  project: HoyProjectInfo | undefined,
): string | null {
  if (!project) return null;
  const key = resolveProjectLifeAreaKey(
    project.life_area_key ?? null,
    project.name,
  ) as LifeAreaKey;
  return lifeAreaCatalogEntry(key).name;
}
