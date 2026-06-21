import { matchProjectForTask, type ProjectForMatch } from '@/lib/batchProjectMatch';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

export type ProjectMeta = ProjectForMatch & {
  due_date?: string | null;
};

export type InferredFrontPattern = {
  key: string;
  name: string;
  emoji: string;
  keywords: string[];
};

export const INFERRED_FRONT_PATTERNS: InferredFrontPattern[] = [
  {
    key: 'koraa',
    name: 'Koraa App',
    emoji: '🚀',
    keywords: [
      'koraa',
      'app',
      'aplicación',
      'application',
      'presentación',
      'presentation',
      'testflight',
      'versión',
      'version',
      'build',
      'app store',
    ],
  },
  {
    key: 'impermanence',
    name: 'Impermanence',
    emoji: '👕',
    keywords: [
      'impermanence',
      'hoodie',
      'hoodies',
      'sudadera',
      'sudaderas',
      'jaqui',
      'reel',
      'tiktok',
      'prenda',
      'muestra',
      'muestras',
      'comercial',
      'merch',
      'playera',
      'cobrar',
      'pago',
      'samples',
      'enviar',
      'producción',
      'produccion',
    ],
  },
  {
    key: 'marathon',
    name: 'Maratón',
    emoji: '🏃',
    keywords: ['maratón', 'marathon', 'conade', 'carrera', 'propuesta maratón'],
  },
  {
    key: 'personal',
    name: 'Personal',
    emoji: '🎬',
    keywords: [
      'cine',
      'película',
      'movie',
      'boletos',
      'tickets',
      'perros',
      'comida',
      'personal',
      'contenido',
      'content',
      'reel personal',
      'tiktok personal',
    ],
  },
];

const LOOSE_FRONT_KEY = 'loose';

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

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function inferFrontKey(content: string, projects: ProjectForMatch[]): string {
  const matchedProjectId = matchProjectForTask(content, projects);
  if (matchedProjectId) return `project:${matchedProjectId}`;

  return inferInferredFrontKey(content);
}

/** Agrupa tareas sueltas en frentes sin proyecto — exportado para Hoy. */
export function inferInferredFrontKey(content: string): string {
  const lower = normalizeText(content);

  if (/\b(conade|maraton|marathon)\b/i.test(lower)) return 'marathon';

  if (
    /\b(koraa)\b/i.test(lower) ||
    (/\b(app|aplicacion|application)\b/i.test(lower) &&
      /\b(terminar|version|presentacion|presentation|build|testflight|ultima)\b/i.test(lower))
  ) {
    return 'koraa';
  }

  if (/\bimpermanence\b/i.test(lower)) return 'impermanence';

  if (/\b(personal)\b/i.test(lower) && !/\bimpermanence\b/i.test(lower)) return 'personal';

  if (/\b(sudadera|sudaderas|jaqui|hoodie|hoodies)\b/i.test(lower)) return 'impermanence';

  if (/\b(cine|boletos|pelicula|movie|tickets)\b/i.test(lower)) return 'personal';

  let best: { key: string; score: number } | null = null;

  for (const pattern of INFERRED_FRONT_PATTERNS) {
    let score = 0;
    for (const keyword of pattern.keywords) {
      if (lower.includes(normalizeText(keyword))) {
        score += keyword.length >= 5 ? 3 : 2;
      }
    }
    if (pattern.key === 'marathon' && /\b(maraton|marathon)\b/i.test(lower)) {
      score += 8;
    }
    if (pattern.key === 'personal' && /\bpersonal\b/i.test(lower)) {
      score += 10;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { key: pattern.key, score };
    }
  }

  return best?.key ?? 'personal';
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
      emoji: '📁',
      projectId,
      isExistingProject: true,
    };
  }

  const pattern = INFERRED_FRONT_PATTERNS.find((entry) => entry.key === key);
  if (pattern) {
    const existing = Object.values(projectsById).find(
      (project) => normalizeText(project.name) === normalizeText(pattern.name),
    );
    if (existing) {
      return {
        name: existing.name,
        emoji: pattern.emoji,
        projectId: existing.id,
        isExistingProject: true,
      };
    }
    return {
      name: pattern.name,
      emoji: pattern.emoji,
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

function frontInferredKey(frontKey: string): string | null {
  if (frontKey.startsWith('project:')) return null;
  return frontKey;
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
  const inferredKey = frontInferredKey(front.key);
  const frontItems = items.filter((item) =>
    front.tasks.some((task) => task.captureId === item.id),
  );
  const hasHeavy = frontItems.some((item) => item.effortFeel === 'heavy');
  const hasTodayTiming = frontItems.some((item) => item.timing === 'today');

  if (dueDate || hasTodayTiming) hints.push('hasDeadline');
  if (inferredKey === 'koraa' || hasHeavy) hints.push('highPriority');
  if (inferredKey === 'impermanence' || front.tasks.length >= 3) hints.push('important');
  if (inferredKey === 'personal') hints.push('personalLife');
  if (!dueDate && !hasTodayTiming && !hints.includes('personalLife')) {
    hints.push('noDeadline');
  }

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
    const pattern = INFERRED_FRONT_PATTERNS.find(
      (entry) => normalizeText(entry.name) === normalizeText(project.name),
    );
    const meta = frontMetaForKey(`project:${project.id}`, projectsById);
    fronts.push({
      key: `project:${project.id}`,
      name: meta.name,
      emoji: pattern?.emoji ?? meta.emoji,
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
  if (INFERRED_FRONT_PATTERNS.some((pattern) => pattern.key === key)) return 1;
  if (key.startsWith('custom:')) return 2;
  if (key === 'loose-group') return 3;
  if (key.startsWith('loose:')) return 4;
  return 2;
}

/** Una sola tarjeta por nombre visible (p. ej. no dos "Personal"). */
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

  const buckets = new Map<string, CaptureFrontTask[]>();

  for (const item of items) {
    const explicitProjectId =
      item.assignToProject && item.selectedProjectId ? item.selectedProjectId : null;
    const key =
      item.frontKeyOverride ??
      (explicitProjectId ? `project:${explicitProjectId}` : inferFrontKey(item.content, projectList));
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
    const base = {
      key,
      name: meta.name,
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
    const base = {
      key: 'loose-group',
      name: 'Personal',
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
