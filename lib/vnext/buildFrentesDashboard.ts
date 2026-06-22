import type { Task } from '@/components/tasks/TaskCard';
import { getLocalDateFromISO, getLocalDateString, normalizeScheduledDate } from '@/lib/dateLocal';
import { inferInferredFrontKey, suggestGroupNameFromTasks } from '@/lib/captureProjectFronts';
import { getProjectEmoji } from '@/lib/projectEmoji';
import { frontThemeForFront } from '@/lib/frentes/frontTheme';
import { getCurrentWeekDates } from '@/lib/lifeAreas/experienceDataMappers';
import { estimateTaskMinutes } from '@/lib/smartPrioritization';

export type FrenteProjectMeta = {
  id: string;
  name: string;
  color?: string | null;
  due_date?: string | null;
};

export type FrenteDashboardItem = {
  key: string;
  name: string;
  emoji: string;
  projectId: string | null;
  openTaskCount: number;
  weekMinutes: number;
  accentColor: string;
  backgroundColor: string;
  borderColor: string;
};

export type FrenteWeekInsightBar = {
  key: string;
  name: string;
  emoji: string;
  percent: number;
  color: string;
};

export type FrentesDashboardModel = {
  fronts: FrenteDashboardItem[];
  weekInsight: FrenteWeekInsightBar[];
  totalOpenTasks: number;
};

type FrontBucket = {
  key: string;
  name: string;
  emoji: string;
  projectId: string | null;
  openTasks: Task[];
  weekMinutes: number;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function inferLooseFront(content: string): Pick<FrontBucket, 'key' | 'name' | 'emoji'> {
  const key = inferInferredFrontKey(content);
  if (key === 'loose') {
    return { key: 'loose', name: 'Otros pasos', emoji: '🌿' };
  }
  const name = suggestGroupNameFromTasks([{ captureId: 'solo', content }]);
  return { key, name, emoji: getProjectEmoji(content) };
}

function taskTouchesWeek(
  task: Task,
  weekDates: string[],
  today: string,
): boolean {
  const scheduled = normalizeScheduledDate(task.scheduled_date);
  if (scheduled && weekDates.includes(scheduled)) return true;

  if (task.is_completed && task.completed_at) {
    const completedDate = getLocalDateFromISO(String(task.completed_at));
    if (weekDates.includes(completedDate)) return true;
  }

  if (!scheduled && !task.is_completed) {
    return today === weekDates.find((date) => date === today);
  }

  return false;
}

function groupTasksIntoFronts(
  tasks: Task[],
  projects: FrenteProjectMeta[],
  weekDates: string[],
  today: string,
): FrontBucket[] {
  const projectsById = Object.fromEntries(projects.map((project) => [project.id, project]));
  const buckets = new Map<string, FrontBucket>();

  for (const task of tasks) {
    if (task.parent_task_id) continue;

    let bucketKey: string;
    let name: string;
    let emoji: string;
    let projectId: string | null = null;

    if (task.project_id && projectsById[task.project_id]) {
      const project = projectsById[task.project_id];
      bucketKey = `project:${project.id}`;
      name = project.name;
      emoji = getProjectEmoji(project.name);
      projectId = project.id;
    } else {
      const inferred = inferLooseFront(task.content);
      bucketKey = `inferred:${inferred.key}`;
      name = inferred.name;
      emoji = inferred.emoji;
    }

    const touchesWeek = taskTouchesWeek(task, weekDates, today);
    const minutes = touchesWeek ? estimateTaskMinutes(task as Parameters<typeof estimateTaskMinutes>[0]) : 0;
    const existing = buckets.get(bucketKey);

    if (existing) {
      if (!task.is_completed) existing.openTasks.push(task);
      existing.weekMinutes += minutes;
      continue;
    }

    buckets.set(bucketKey, {
      key: bucketKey,
      name,
      emoji,
      projectId,
      openTasks: task.is_completed ? [] : [task],
      weekMinutes: minutes,
    });
  }

  return [...buckets.values()];
}

export function buildFrentesDashboard(
  tasks: Task[],
  projects: FrenteProjectMeta[],
  today: string = getLocalDateString(),
): FrentesDashboardModel {
  const weekDates = getCurrentWeekDates(today);
  const buckets = groupTasksIntoFronts(tasks, projects, weekDates, today);

  for (const project of projects) {
    const key = `project:${project.id}`;
    if (buckets.some((bucket) => bucket.key === key)) continue;
    buckets.push({
      key,
      name: project.name,
      emoji: getProjectEmoji(project.name),
      projectId: project.id,
      openTasks: [],
      weekMinutes: 0,
    });
  }

  const sorted = [...buckets].sort((a, b) => {
    if (b.openTasks.length !== a.openTasks.length) {
      return b.openTasks.length - a.openTasks.length;
    }
    return b.weekMinutes - a.weekMinutes;
  });

  const fronts: FrenteDashboardItem[] = sorted.map((bucket, index) => {
    const theme = frontThemeForFront(
      { key: bucket.key.replace(/^(project|inferred):/, ''), name: bucket.name },
      index,
    );
    return {
      key: bucket.key,
      name: bucket.name.replace(/\s+App$/i, ''),
      emoji: bucket.emoji,
      projectId: bucket.projectId,
      openTaskCount: bucket.openTasks.length,
      weekMinutes: bucket.weekMinutes,
      accentColor: theme.accent,
      backgroundColor: theme.bg,
      borderColor: theme.border,
    };
  });

  const totalWeekMinutes = fronts.reduce((sum, front) => sum + front.weekMinutes, 0);
  const weekInsight: FrenteWeekInsightBar[] = [...fronts]
    .filter((front) => front.weekMinutes > 0)
    .sort((a, b) => b.weekMinutes - a.weekMinutes)
    .slice(0, 5)
    .map((front) => ({
      key: front.key,
      name: front.name,
      emoji: front.emoji,
      color: front.accentColor,
      percent:
        totalWeekMinutes > 0
          ? Math.round((front.weekMinutes / totalWeekMinutes) * 100)
          : 0,
    }));

  return {
    fronts,
    weekInsight,
    totalOpenTasks: fronts.reduce((sum, front) => sum + front.openTaskCount, 0),
  };
}

export function getOpenTasksForFront(
  tasks: Task[],
  projects: FrenteProjectMeta[],
  frontKey: string,
  today: string = getLocalDateString(),
): Task[] {
  const weekDates = getCurrentWeekDates(today);
  const buckets = groupTasksIntoFronts(tasks, projects, weekDates, today);
  const bucket = buckets.find((entry) => entry.key === frontKey);
  return bucket?.openTasks ?? [];
}
