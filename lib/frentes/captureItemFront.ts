import {
  buildCaptureFronts,
  inferInferredFrontKey,
  type CaptureFront,
  type ProjectMeta,
} from '@/lib/captureProjectFronts';
import type { ProjectForMatch } from '@/lib/batchProjectMatch';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import { nextCaptureRankInFront } from '@/lib/frentes/reorderCapturePriority';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';

export const LOOSE_FRONT_BUCKET = 'loose';

export type CaptureAssignmentKind = 'loose' | 'existing_project' | 'new_project';

export type FrenteMoveTarget = {
  key: string;
  label: string;
  emoji: string;
  subtitle?: string;
};

export function getItemAssignmentKind(item: EnrichedCaptureItem): CaptureAssignmentKind {
  if (item.assignToProject && item.selectedProjectId) return 'existing_project';
  if (item.createProjectOnSave) return 'new_project';
  return 'loose';
}

export function applyAssignmentKind(
  item: EnrichedCaptureItem,
  kind: CaptureAssignmentKind,
  options?: { projectId?: string; frontKey?: string; lifeAreaKey?: LifeAreaRef | null },
): EnrichedCaptureItem {
  if (kind === 'existing_project' && options?.projectId) {
    return {
      ...item,
      assignToProject: true,
      selectedProjectId: options.projectId,
      frontKeyOverride: null,
      createProjectOnSave: false,
      lifeAreaKey: null,
    };
  }

  if (kind === 'new_project') {
    const frontKey =
      options?.frontKey ?? item.frontKeyOverride ?? inferInferredFrontKey(item.content);
    return {
      ...item,
      assignToProject: false,
      selectedProjectId: null,
      frontKeyOverride: frontKey,
      createProjectOnSave: true,
      lifeAreaKey: null,
    };
  }

  return {
    ...item,
    assignToProject: false,
    selectedProjectId: null,
    frontKeyOverride: LOOSE_FRONT_BUCKET,
    createProjectOnSave: false,
    lifeAreaKey: options?.lifeAreaKey ?? item.lifeAreaKey ?? null,
  };
}

export function moveCaptureItemToFrontKey(
  items: EnrichedCaptureItem[],
  captureId: string,
  targetKey: string,
  projects: ProjectMeta[] = [],
): EnrichedCaptureItem[] {
  const reassigned = items.map((item) => {
    if (item.id !== captureId) return item;

    if (targetKey.startsWith('project:')) {
      const projectId = targetKey.slice('project:'.length);
      return applyAssignmentKind(item, 'existing_project', { projectId });
    }

    if (targetKey === LOOSE_FRONT_BUCKET || targetKey.startsWith('loose:')) {
      return applyAssignmentKind(item, 'loose');
    }

    return {
      ...item,
      assignToProject: false,
      selectedProjectId: null,
      frontKeyOverride: targetKey,
      createProjectOnSave: item.createProjectOnSave ?? false,
    };
  });

  const nextRank = nextCaptureRankInFront(
    reassigned.filter((item) => item.id !== captureId),
    targetKey,
    projects,
  );

  return reassigned.map((item) =>
    item.id === captureId ? { ...item, captureRank: nextRank } : item,
  );
}

export function findFrontForCaptureId(
  fronts: CaptureFront[],
  captureId: string,
): CaptureFront | null {
  return fronts.find((front) => front.tasks.some((task) => task.captureId === captureId)) ?? null;
}

export function buildFrenteMoveTargets(
  fronts: CaptureFront[],
  projects: ProjectMeta[],
  currentFrontKey: string,
): FrenteMoveTarget[] {
  const seen = new Set<string>();
  const targets: FrenteMoveTarget[] = [];

  const push = (target: FrenteMoveTarget) => {
    if (seen.has(target.key) || target.key === currentFrontKey) return;
    seen.add(target.key);
    targets.push(target);
  };

  for (const front of fronts) {
    push({
      key: front.key,
      label: front.name.replace(/\s+App$/i, ''),
      emoji: front.emoji,
    });
  }

  for (const project of projects) {
    const key = `project:${project.id}`;
    push({
      key,
      label: project.name,
      emoji: '📁',
    });
  }

  push({
    key: LOOSE_FRONT_BUCKET,
    label: 'Personal',
    emoji: '🌿',
  });

  return targets;
}

export function resolveItemFrontKey(
  item: EnrichedCaptureItem,
  projectList: ProjectForMatch[],
): string {
  const explicitProjectId =
    item.assignToProject && item.selectedProjectId ? item.selectedProjectId : null;
  if (item.frontKeyOverride) return item.frontKeyOverride;
  if (explicitProjectId) return `project:${explicitProjectId}`;
  return inferInferredFrontKey(item.content);
}

export function frontKeyForItem(
  item: EnrichedCaptureItem,
  fronts: CaptureFront[],
): string {
  const front = findFrontForCaptureId(fronts, item.id);
  return front?.key ?? resolveItemFrontKey(item, []);
}

export function summarizeFrontsForExplainer(
  items: EnrichedCaptureItem[],
  projects: ProjectMeta[],
): { frontCount: number; taskCount: number; frontNames: string[] } {
  const { fronts, taskCount, frontCount } = buildCaptureFronts(items, projects);
  return {
    frontCount,
    taskCount,
    frontNames: fronts.map((front) => front.name.replace(/\s+App$/i, '')).slice(0, 4),
  };
}
