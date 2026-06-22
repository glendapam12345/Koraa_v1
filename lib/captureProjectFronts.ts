import { matchProjectForTask, type ProjectForMatch } from '@/lib/batchProjectMatch';
import { getProjectEmoji } from '@/lib/projectEmoji';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

export type ProjectMeta = ProjectForMatch & {
  due_date?: string | null;
  color?: string;
};

const LOOSE_FRONT_KEY = 'loose';

const GROUP_NAME_STOPWORDS = new Set([
  'necesito',
  'terminar',
  'hacer',
  'ver',
  'comprar',
  'enviar',
  'mañana',
  'hoy',
  'para',
  'como',
  'van',
  'mis',
  'las',
  'los',
  'una',
  'uno',
  'del',
  'de',
  'la',
  'el',
  'en',
  'y',
  'a',
  'need',
  'finish',
  'make',
  'buy',
  'send',
  'tomorrow',
  'today',
  'the',
  'and',
  'for',
  'with',
]);

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** Palabras significativas del texto — sin marcas ni categorías fijas. */
export function extractSignificantTokens(content: string): string[] {
  return normalizeText(content)
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !GROUP_NAME_STOPWORDS.has(word))
    .sort((a, b) => b.length - a.length);
}

export function buildWordCountsFromContents(contents: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const content of contents) {
    for (const token of extractSignificantTokens(content)) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }
  return counts;
}

/** Nombre legible sugerido a partir del contenido — no nombres fijos de marca. */
export function suggestGroupNameFromTasks(tasks: CaptureFrontTask[]): string {
  if (tasks.length === 0) return 'Proyecto nuevo';
  if (tasks.length === 1) {
    const content = tasks[0].content.trim();
    return content.length > 36 ? `${content.slice(0, 33)}…` : content;
  }

  const counts = new Map<string, number>();
  for (const task of tasks) {
    for (const word of normalizeText(task.content).split(/\s+/)) {
      if (word.length < 4 || GROUP_NAME_STOPWORDS.has(word)) continue;
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const best = ranked[0];
  if (best && best[1] >= 2) {
    const label = best[0];
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  const first = tasks[0].content.trim();
  return first.length > 36 ? `${first.slice(0, 33)}…` : first;
}

function resolvedFrontName(
  key: string,
  meta: Pick<CaptureFront, 'name' | 'isExistingProject'>,
  tasks: CaptureFrontTask[],
): string {
  if (meta.isExistingProject && meta.name.trim()) return meta.name;
  if (key.startsWith('token:') || key.startsWith('custom:') || key === 'loose-group') {
    return suggestGroupNameFromTasks(tasks);
  }
  if (meta.name.trim()) return meta.name;
  return suggestGroupNameFromTasks(tasks);
}

export type CaptureFrontTask = {
  captureId: string;
  content: string;
};

export type FrontHintKey =
  | 'highPriority'
  | 'hasDeadline'
  | 'important'
  | 'noDeadline'
  | 'personalLife'
  | 'empty';

export type CaptureFront = {
  key: string;
  name: string;
  emoji: string;
  projectId: string | null;
  isExistingProject: boolean;
  suggestedNewProject: boolean;
  tasks: CaptureFrontTask[];
  hints: FrontHintKey[];
};

export type CaptureFrontRecommendation = {
  frontKey: string;
  frontName: string;
  reasonKey: 'deadlineApproaching' | 'highImpact' | 'clarity';
};

export type CaptureFrontQuickSummary = {
  projectCount: number;
  taskCount: number;
  importantDatesCount: number;
};

export type CaptureFrontsResult = {
  taskCount: number;
  frontCount: number;
  fronts: CaptureFront[];
  recommendation: CaptureFrontRecommendation | null;
  quickSummary: CaptureFrontQuickSummary;
};

function inferFrontKey(
  content: string,
  projects: ProjectForMatch[],
  wordCounts: Map<string, number>,
): string {
  const matchedProjectId = matchProjectForTask(content, projects);
  if (matchedProjectId) return `project:${matchedProjectId}`;

  return inferInferredFrontKey(content, wordCounts);
}

/** Agrupa tareas sueltas por palabras compartidas — sin rutas de marca. */
export function inferInferredFrontKey(
  content: string,
  globalWordCounts?: Map<string, number>,
): string {
  const tokens = extractSignificantTokens(content);
  if (tokens.length === 0) return LOOSE_FRONT_KEY;

  if (globalWordCounts && globalWordCounts.size > 0) {
    const ranked = [...tokens].sort(
      (a, b) => (globalWordCounts.get(b) ?? 0) - (globalWordCounts.get(a) ?? 0),
    );
    const best = ranked[0];
    if (best) return `token:${best}`;
  }

  return `token:${tokens[0]}`;
}

function frontMetaForKey(
  key: string,
  projectsById: Record<string, ProjectMeta>,
): Pick<CaptureFront, 'name' | 'emoji' | 'projectId' | 'isExistingProject'> {
  if (key.startsWith('project:')) {
    const projectId = key.slice('project:'.length);
    const project = projectsById[projectId];
    return {
      name: project?.name ?? 'Proyecto',
      emoji: project ? getProjectEmoji(project.name) : '📁',
      projectId,
      isExistingProject: true,
    };
  }

  if (key.startsWith('token:') || key.startsWith('custom:') || key === 'loose-group') {
    return {
      name: '',
      emoji: '🌿',
      projectId: null,
      isExistingProject: false,
    };
  }

  return {
    name: '',
    emoji: '🌿',
    projectId: null,
    isExistingProject: false,
  };
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

function impactWeight(item: EnrichedCaptureItem): number {
  let score = 0;
  if (item.effortFeel === 'heavy') score += 3;
  if (item.effortFeel === 'medium') score += 1;
  if (/\b(pitch|presentación|presentation|lanzamiento|launch|deadline|urgente|urgent)\b/i.test(item.content)) {
    score += 2;
  }
  return score;
}

function inferFrontHints(
  front: Omit<CaptureFront, 'hints'>,
  items: EnrichedCaptureItem[],
  projectsById: Record<string, ProjectMeta>,
): FrontHintKey[] {
  const hints: FrontHintKey[] = [];

  if (front.tasks.length === 0) {
    hints.push('empty');
    const dueDate = front.projectId ? projectsById[front.projectId]?.due_date : null;
    hints.push(dueDate ? 'hasDeadline' : 'noDeadline');
    return hints.slice(0, 2);
  }

  const dueDate = front.projectId ? projectsById[front.projectId]?.due_date : null;
  const frontItems = items.filter((item) =>
    front.tasks.some((task) => task.captureId === item.id),
  );
  const hasHeavy = frontItems.some((item) => item.effortFeel === 'heavy');
  const hasTodayTiming = frontItems.some((item) => item.timing === 'today');

  if (dueDate || hasTodayTiming) hints.push('hasDeadline');
  if (hasHeavy) hints.push('highPriority');
  if (front.tasks.length >= 3) hints.push('important');
  if (!dueDate && !hasTodayTiming) hints.push('noDeadline');

  return [...new Set(hints)].slice(0, 2);
}

function appendEmptyExistingProjects(
  fronts: CaptureFront[],
  projects: ProjectMeta[],
  projectsById: Record<string, ProjectMeta>,
): CaptureFront[] {
  const representedProjectIds = new Set(
    fronts.map((front) => front.projectId).filter((id): id is string => Boolean(id)),
  );
  const representedNames = new Set(fronts.map((front) => normalizeText(front.name)));

  const emptyCandidates = projects
    .filter((project) => {
      if (representedProjectIds.has(project.id)) return false;
      if (representedNames.has(normalizeText(project.name))) return false;
      return true;
    })
    .sort((a, b) => {
      const aDue = a.due_date ? daysUntil(a.due_date) : 999;
      const bDue = b.due_date ? daysUntil(b.due_date) : 999;
      return aDue - bDue;
    })
    .slice(0, 2);

  for (const project of emptyCandidates) {
    const meta = frontMetaForKey(`project:${project.id}`, projectsById);
    fronts.push({
      key: `project:${project.id}`,
      name: meta.name,
      emoji: getProjectEmoji(project.name),
      projectId: project.id,
      isExistingProject: true,
      suggestedNewProject: false,
      tasks: [],
      hints: inferFrontHints(
        {
          key: `project:${project.id}`,
          name: meta.name,
          emoji: meta.emoji,
          projectId: project.id,
          isExistingProject: true,
          suggestedNewProject: false,
          tasks: [],
        },
        [],
        projectsById,
      ),
    });
  }

  return fronts;
}

function buildQuickSummary(
  fronts: CaptureFront[],
  items: EnrichedCaptureItem[],
  projectsById: Record<string, ProjectMeta>,
): CaptureFrontQuickSummary {
  let importantDatesCount = items.filter((item) => Boolean(item.selectedDate)).length;
  for (const front of fronts) {
    if (!front.projectId) continue;
    const dueDate = projectsById[front.projectId]?.due_date;
    if (!dueDate) continue;
    const days = daysUntil(dueDate);
    if (days >= 0 && days <= 14) importantDatesCount += 1;
  }

  return {
    projectCount: fronts.length,
    taskCount: items.length,
    importantDatesCount,
  };
}

function frontDisplayName(front: Pick<CaptureFront, 'name'>): string {
  return front.name.replace(/\s+App$/i, '').trim();
}

function frontKeyMergePriority(key: string): number {
  if (key.startsWith('project:')) return 0;
  if (key.startsWith('token:')) return 1;
  if (key.startsWith('custom:')) return 2;
  if (key === 'loose-group') return 3;
  if (key.startsWith('loose:')) return 4;
  return 2;
}

/** Una sola tarjeta por nombre visible. */
function mergeDuplicateNamedFronts(
  fronts: CaptureFront[],
  items: EnrichedCaptureItem[],
  projectsById: Record<string, ProjectMeta>,
): CaptureFront[] {
  const groups = new Map<string, CaptureFront[]>();

  for (const front of fronts) {
    const norm = normalizeText(frontDisplayName(front));
    const list = groups.get(norm) ?? [];
    list.push(front);
    groups.set(norm, list);
  }

  const merged: CaptureFront[] = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      merged.push(group[0]);
      continue;
    }

    const canonical = [...group].sort(
      (a, b) => frontKeyMergePriority(a.key) - frontKeyMergePriority(b.key),
    )[0];

    const taskById = new Map<string, CaptureFrontTask>();
    for (const front of group) {
      for (const task of front.tasks) {
        taskById.set(task.captureId, task);
      }
    }

    const sortedTasks = [...taskById.values()].sort((a, b) => {
      const rankA = items.find((entry) => entry.id === a.captureId)?.captureRank ?? 0;
      const rankB = items.find((entry) => entry.id === b.captureId)?.captureRank ?? 0;
      return rankA - rankB;
    });

    const wantsNewProject = group.some((front) => front.suggestedNewProject);
    const base = {
      key: canonical.key,
      name: canonical.name,
      emoji: canonical.emoji,
      projectId: canonical.projectId,
      isExistingProject: canonical.isExistingProject,
      suggestedNewProject: wantsNewProject || sortedTasks.length >= 2,
      tasks: sortedTasks,
    };

    merged.push({
      ...base,
      hints: inferFrontHints(base, items, projectsById),
    });
  }

  return merged;
}

export function buildCaptureFronts(
  items: EnrichedCaptureItem[],
  projects: ProjectMeta[] = [],
): CaptureFrontsResult {
  if (items.length === 0) {
    return {
      taskCount: 0,
      frontCount: 0,
      fronts: [],
      recommendation: null,
      quickSummary: { projectCount: 0, taskCount: 0, importantDatesCount: 0 },
    };
  }

  const projectsById = Object.fromEntries(projects.map((project) => [project.id, project]));
  const projectList = projects.map((project) => ({ id: project.id, name: project.name }));
  const wordCounts = buildWordCountsFromContents(items.map((item) => item.content));

  const buckets = new Map<string, CaptureFrontTask[]>();

  for (const item of items) {
    const explicitProjectId =
      item.assignToProject && item.selectedProjectId ? item.selectedProjectId : null;
    const key =
      item.frontKeyOverride ??
      (explicitProjectId ? `project:${explicitProjectId}` : inferFrontKey(item.content, projectList, wordCounts));
    const list = buckets.get(key) ?? [];
    list.push({ captureId: item.id, content: item.content });
    buckets.set(key, list);
  }

  const looseTasks = buckets.get(LOOSE_FRONT_KEY) ?? [];
  buckets.delete(LOOSE_FRONT_KEY);

  const sortTasksInBucket = (tasks: CaptureFrontTask[]) =>
    [...tasks].sort((a, b) => {
      const rankA = items.find((entry) => entry.id === a.captureId)?.captureRank ?? 0;
      const rankB = items.find((entry) => entry.id === b.captureId)?.captureRank ?? 0;
      return rankA - rankB;
    });

  const fronts: CaptureFront[] = [];

  for (const [key, tasks] of buckets.entries()) {
    const sortedTasks = sortTasksInBucket(tasks);
    const meta = frontMetaForKey(key, projectsById);
    const wantsNewProject = tasks.some((task) => {
      const item = items.find((entry) => entry.id === task.captureId);
      return Boolean(item?.createProjectOnSave);
    });
    const displayName = resolvedFrontName(key, meta, sortedTasks);
    const base = {
      key,
      name: displayName,
      emoji: meta.emoji,
      projectId: meta.projectId,
      isExistingProject: meta.isExistingProject,
      suggestedNewProject:
        (!meta.isExistingProject && sortedTasks.length >= 2) || wantsNewProject,
      tasks: sortedTasks,
    };
    fronts.push({
      ...base,
      hints: inferFrontHints(base, items, projectsById),
    });
  }

  if (looseTasks.length > 0) {
    const sortedLoose = sortTasksInBucket(looseTasks);
    const looseName = suggestGroupNameFromTasks(sortedLoose);
    const base = {
      key: 'loose-group',
      name: looseName,
      emoji: '🌿',
      projectId: null,
      isExistingProject: false,
      suggestedNewProject: false,
      tasks: sortedLoose,
    };
    fronts.push({
      ...base,
      hints: inferFrontHints(base, items, projectsById),
    });
  }

  appendEmptyExistingProjects(fronts, projects, projectsById);
  const dedupedFronts = mergeDuplicateNamedFronts(fronts, items, projectsById);
  dedupedFronts.sort((a, b) => b.tasks.length - a.tasks.length);

  const recommendation = pickRecommendation(dedupedFronts, items, projectsById);
  const quickSummary = buildQuickSummary(dedupedFronts, items, projectsById);

  return {
    taskCount: items.length,
    frontCount: dedupedFronts.length,
    fronts: dedupedFronts,
    recommendation,
    quickSummary,
  };
}

function pickRecommendation(
  fronts: CaptureFront[],
  items: EnrichedCaptureItem[],
  projectsById: Record<string, ProjectMeta>,
): CaptureFrontRecommendation | null {
  if (fronts.length === 0) return null;
  if (fronts.length === 1) {
    return {
      frontKey: fronts[0].key,
      frontName: fronts[0].name,
      reasonKey: 'clarity',
    };
  }

  let bestDeadline: { front: CaptureFront; days: number } | null = null;
  for (const front of fronts) {
    if (!front.projectId) continue;
    const dueDate = projectsById[front.projectId]?.due_date;
    if (!dueDate) continue;
    const days = daysUntil(dueDate);
    if (days >= 0 && days <= 14 && (!bestDeadline || days < bestDeadline.days)) {
      bestDeadline = { front, days };
    }
  }
  if (bestDeadline) {
    return {
      frontKey: bestDeadline.front.key,
      frontName: bestDeadline.front.name,
      reasonKey: 'deadlineApproaching',
    };
  }

  const impactByFront = new Map<string, number>();
  for (const item of items) {
    const front = fronts.find((entry) => entry.tasks.some((task) => task.captureId === item.id));
    if (!front) continue;
    impactByFront.set(front.key, (impactByFront.get(front.key) ?? 0) + impactWeight(item));
  }

  const topImpact = [...impactByFront.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topImpact && topImpact[1] > 0) {
    const front = fronts.find((entry) => entry.key === topImpact[0]);
    if (front) {
      return {
        frontKey: front.key,
        frontName: front.name,
        reasonKey: 'highImpact',
      };
    }
  }

  return {
    frontKey: fronts[0].key,
    frontName: fronts[0].name,
    reasonKey: 'clarity',
  };
}
