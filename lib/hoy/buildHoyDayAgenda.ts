import type { Task } from '@/components/tasks/TaskCard';
import type { AppLocale } from '@/lib/i18n';
import {
  formatFocusTaskDuration,
  getFocusTaskEstimatedMinutes,
  type HoyProjectInfo,
} from '@/lib/hoy/focusTaskDisplay';
import type { TaskPlanningMeta } from '@/lib/taskPlanningMeta';
import { formatPreferredTimeLabel, isValidPreferredTime } from '@/lib/taskPreferredTime';
import { THEME } from '@/constants/theme';

export type HoyDayAgendaItem = {
  taskId: string;
  title: string;
  timeLabel: string;
  sortMinutes: number;
  durationLabel: string | null;
  accentColor: string;
};

export type HoyDayAgendaModel = {
  timed: HoyDayAgendaItem[];
  timedTaskIds: Set<string>;
};

function preferredTimeToSortMinutes(hhmm: string): number {
  const trimmed = hhmm.trim();
  if (!isValidPreferredTime(trimmed)) return Number.MAX_SAFE_INTEGER;
  const [hours, minutes] = trimmed.split(':').map((part) => parseInt(part, 10));
  return hours * 60 + minutes;
}

function resolveAccentColor(task: Task, projectsMap: Record<string, HoyProjectInfo>): string {
  const project = task.project_id ? projectsMap[task.project_id] : undefined;
  return project?.color ?? THEME.colors.calm.lavenderDeep;
}

export function buildHoyDayAgenda(
  tasks: Task[],
  planningMeta: Record<string, TaskPlanningMeta>,
  projectsMap: Record<string, HoyProjectInfo>,
  locale: AppLocale,
): HoyDayAgendaModel {
  const timed: HoyDayAgendaItem[] = [];

  for (const task of tasks) {
    if (task.is_completed || task.parent_task_id) continue;
    const meta = planningMeta[task.id];
    const preferredTime = meta?.preferredTime;
    if (!preferredTime || !isValidPreferredTime(preferredTime)) continue;

    const timeLabel = formatPreferredTimeLabel(preferredTime, locale);
    if (!timeLabel) continue;

    const minutes = getFocusTaskEstimatedMinutes(task, meta);
    timed.push({
      taskId: task.id,
      title: task.content,
      timeLabel,
      sortMinutes: preferredTimeToSortMinutes(preferredTime),
      durationLabel: minutes > 0 ? formatFocusTaskDuration(minutes) : null,
      accentColor: resolveAccentColor(task, projectsMap),
    });
  }

  timed.sort((a, b) => a.sortMinutes - b.sortMinutes);

  return {
    timed,
    timedTaskIds: new Set(timed.map((item) => item.taskId)),
  };
}
