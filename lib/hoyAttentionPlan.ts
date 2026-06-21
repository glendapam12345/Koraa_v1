import type { Task } from '@/hooks/useTasks';
import {
  estimateTaskMinutes,
  getAvailableMinutesFromCheckIn,
  type CheckInData,
} from '@/lib/smartPrioritization';
import { INFERRED_FRONT_PATTERNS, inferInferredFrontKey } from '@/lib/captureProjectFronts';

export type HoyProjectMeta = {
  id: string;
  name: string;
  due_date?: string | null;
};

export type HoyAttentionReasonKey =
  | 'deadlineApproaching'
  | 'highImpact'
  | 'lowEnergy'
  | 'clarity';

export type HoyAttentionOption = {
  taskId: string;
  content: string;
  minutes: number;
};

export type HoyAttentionPlan = {
  activeFrontCount: number;
  projectName: string;
  projectEmoji: string;
  projectId: string | null;
  focusTask: HoyAttentionOption;
  focusTasks: HoyAttentionOption[];
  reasonKey: HoyAttentionReasonKey;
  otherOptions: HoyAttentionOption[];
  parkedCount: number;
  parkedTasks: HoyAttentionOption[];
};

type FrontBucket = {
  key: string;
  name: string;
  emoji: string;
  projectId: string | null;
  tasks: Task[];
  dueDate: string | null;
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
    return { key: 'loose', name: 'Personal', emoji: '🌿' };
  }
  const pattern = INFERRED_FRONT_PATTERNS.find((entry) => entry.key === key);
  if (pattern) {
    return { key: pattern.key, name: pattern.name, emoji: pattern.emoji };
  }
  return { key: 'loose', name: 'Otros pasos', emoji: '🌿' };
}

function daysUntil(isoDate: string, now: Date = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(
    Number(isoDate.slice(0, 4)),
    Number(isoDate.slice(5, 7)) - 1,
    Number(isoDate.slice(8, 10)),
  );
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function suggestedScopeMinutes(
  energyLevel: number,
  taskMinutes: number,
  availableMinutes: number,
): number {
  const energyCap =
    energyLevel <= 2 ? 20 : energyLevel === 3 ? 30 : energyLevel === 4 ? 45 : 60;
  const timeCap = Math.max(15, Math.floor(availableMinutes * 0.25));
  return Math.max(15, Math.min(taskMinutes, energyCap, timeCap));
}

function taskImpactScore(task: Task): number {
  let score = 0;
  if (task.perceivedEffort === 'heavy') score += 3;
  if (task.perceivedEffort === 'medium') score += 1;
  if (task.is_priority) score += 2;
  if (/\b(pitch|presentación|presentation|lanzamiento|launch|urgente|urgent)\b/i.test(task.content)) {
    score += 2;
  }
  return score;
}

function groupTasksByFront(tasks: Task[], projects: HoyProjectMeta[]): FrontBucket[] {
  const projectsById = Object.fromEntries(projects.map((project) => [project.id, project]));
  const buckets = new Map<string, FrontBucket>();

  for (const task of tasks) {
    if (task.parent_task_id) continue;

    let bucketKey: string;
    let name: string;
    let emoji: string;
    let projectId: string | null = null;
    let dueDate: string | null = null;

    if (task.project_id && projectsById[task.project_id]) {
      const project = projectsById[task.project_id];
      bucketKey = `project:${project.id}`;
      name = project.name;
      emoji =
        INFERRED_FRONT_PATTERNS.find(
          (pattern) => normalizeText(pattern.name) === normalizeText(project.name),
        )?.emoji ?? '📁';
      projectId = project.id;
      dueDate = project.due_date ?? null;
    } else {
      const inferred = inferLooseFront(task.content);
      bucketKey = `inferred:${inferred.key}`;
      name = inferred.name;
      emoji = inferred.emoji;
    }

    const existing = buckets.get(bucketKey);
    if (existing) {
      existing.tasks.push(task);
      continue;
    }

    buckets.set(bucketKey, {
      key: bucketKey,
      name,
      emoji,
      projectId,
      tasks: [task],
      dueDate,
    });
  }

  return [...buckets.values()];
}

function scoreFront(front: FrontBucket): number {
  let score = front.tasks.reduce((sum, task) => sum + taskImpactScore(task), 0);
  if (front.dueDate) {
    const days = daysUntil(front.dueDate);
    if (days >= 0 && days <= 7) score += 12;
    else if (days <= 14) score += 7;
  }
  return score;
}

function pickBestTask(front: FrontBucket, checkIn: CheckInData): Task {
  const availableMinutes = getAvailableMinutesFromCheckIn(checkIn.availableTime);
  const ranked = [...front.tasks].sort((a, b) => {
    const scoreA = taskImpactScore(a) + (estimateTaskMinutes(a) <= availableMinutes ? 2 : 0);
    const scoreB = taskImpactScore(b) + (estimateTaskMinutes(b) <= availableMinutes ? 2 : 0);
    return scoreB - scoreA;
  });
  return ranked[0] ?? front.tasks[0];
}

function pickReasonKey(
  front: FrontBucket,
  checkIn: CheckInData,
): HoyAttentionReasonKey {
  if (front.dueDate) {
    const days = daysUntil(front.dueDate);
    if (days >= 0 && days <= 14) return 'deadlineApproaching';
  }
  if (checkIn.energyLevel <= 2) return 'lowEnergy';
  if (scoreFront(front) >= 4) return 'highImpact';
  return 'clarity';
}

/** Motor de atención: un frente, un paso, alcance acotado a tu energía y tiempo. */
export function buildHoyAttentionPlan(
  tasks: Task[],
  projects: HoyProjectMeta[],
  checkIn: CheckInData,
): HoyAttentionPlan | null {
  const incomplete = tasks.filter((task) => !task.is_completed && !task.parent_task_id);
  if (incomplete.length === 0) return null;

  const fronts = groupTasksByFront(incomplete, projects);
  if (fronts.length === 0) return null;

  const rankedFronts = [...fronts].sort((a, b) => scoreFront(b) - scoreFront(a));
  const focusFront = rankedFronts[0];
  const availableMinutes = getAvailableMinutesFromCheckIn(checkIn.availableTime);

  const rankedFocusTasks = [...focusFront.tasks]
    .sort((a, b) => taskImpactScore(b) - taskImpactScore(a))
    .slice(0, 2);

  const focusTasks: HoyAttentionOption[] = rankedFocusTasks.map((task) => ({
    taskId: task.id,
    content: task.content,
    minutes: suggestedScopeMinutes(
      checkIn.energyLevel,
      estimateTaskMinutes(task),
      availableMinutes,
    ),
  }));

  const primaryFocus =
    focusTasks[0] ??
    (() => {
      const fallback = pickBestTask(focusFront, checkIn);
      return {
        taskId: fallback.id,
        content: fallback.content,
        minutes: suggestedScopeMinutes(
          checkIn.energyLevel,
          estimateTaskMinutes(fallback),
          availableMinutes,
        ),
      };
    })();

  const usedIds = new Set(focusTasks.map((entry) => entry.taskId));
  const otherOptions: HoyAttentionOption[] = [];

  for (const front of rankedFronts) {
    for (const task of front.tasks) {
      if (usedIds.has(task.id)) continue;
      const minutes = estimateTaskMinutes(task);
      if (minutes > 25) continue;
      otherOptions.push({
        taskId: task.id,
        content: task.content,
        minutes,
      });
      usedIds.add(task.id);
      if (otherOptions.length >= 2) break;
    }
    if (otherOptions.length >= 2) break;
  }

  const parkedTasks: HoyAttentionOption[] = [];
  for (const task of incomplete) {
    if (usedIds.has(task.id)) continue;
    parkedTasks.push({
      taskId: task.id,
      content: task.content,
      minutes: estimateTaskMinutes(task),
    });
    if (parkedTasks.length >= 4) break;
  }

  return {
    activeFrontCount: fronts.length,
    projectName: focusFront.name,
    projectEmoji: focusFront.emoji,
    projectId: focusFront.projectId,
    focusTask: primaryFocus,
    focusTasks,
    reasonKey: pickReasonKey(focusFront, checkIn),
    otherOptions,
    parkedCount: Math.max(0, incomplete.length - focusTasks.length - otherOptions.length),
    parkedTasks,
  };
}
