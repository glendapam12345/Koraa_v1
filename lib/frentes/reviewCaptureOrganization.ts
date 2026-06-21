import type { CaptureFront } from '@/lib/captureProjectFronts';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import { enrichCaptureItem } from '@/lib/taskIntelligentEnrichment';
import type { ProjectForMatch } from '@/lib/batchProjectMatch';
import type { FrenteMoveTarget } from '@/lib/frentes/captureItemFront';

export type GroupDisplayOverride = {
  name: string;
  emoji: string;
};

export const CUSTOM_FRONT_PREFIX = 'custom:';

export function buildCustomFrontKey(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 24);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${CUSTOM_FRONT_PREFIX}${slug || 'grupo'}-${suffix}`;
}

export function isCustomFrontKey(key: string): boolean {
  return key.startsWith(CUSTOM_FRONT_PREFIX);
}

export function applyGroupDisplayOverrides(
  fronts: CaptureFront[],
  overrides: Record<string, GroupDisplayOverride>,
): CaptureFront[] {
  return fronts.map((front) => {
    const override = overrides[front.key];
    if (!override) return front;
    return { ...front, name: override.name, emoji: override.emoji };
  });
}

export function buildEmptyGroupFronts(
  emptyKeys: string[],
  overrides: Record<string, GroupDisplayOverride>,
): CaptureFront[] {
  return emptyKeys.map((key) => {
    const override = overrides[key];
    return {
      key,
      name: override?.name ?? 'Grupo',
      emoji: override?.emoji ?? '✨',
      projectId: null,
      isExistingProject: false,
      suggestedNewProject: false,
      tasks: [],
      hints: ['empty', 'noDeadline'] as CaptureFront['hints'],
    };
  });
}

export function appendExtraMoveTargets(
  targets: FrenteMoveTarget[],
  emptyKeys: string[],
  overrides: Record<string, GroupDisplayOverride>,
  currentFrontKey: string,
): FrenteMoveTarget[] {
  const seen = new Set(targets.map((target) => target.key));
  const merged = [...targets];

  for (const key of emptyKeys) {
    if (seen.has(key) || key === currentFrontKey) continue;
    const override = overrides[key];
    merged.push({
      key,
      label: override?.name ?? 'Grupo',
      emoji: override?.emoji ?? '✨',
    });
    seen.add(key);
  }

  return merged;
}

type CreateReviewItemOptions = {
  frontKey: string;
  projects?: ProjectForMatch[];
  assignToProject?: boolean;
  projectId?: string | null;
  createProjectOnSave?: boolean;
};

export function createReviewCaptureItem(
  content: string,
  options: CreateReviewItemOptions,
): EnrichedCaptureItem {
  const trimmed = content.trim();
  const id = `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const projects = options.projects ?? [];

  const isProjectFront = options.frontKey.startsWith('project:');
  const projectIdFromFront = isProjectFront
    ? options.frontKey.slice('project:'.length)
    : null;

  const base = {
    id,
    content: trimmed,
    assignToProject: Boolean(options.assignToProject ?? projectIdFromFront),
    selectedCategory: 'otros',
    selectedProjectId: options.projectId ?? projectIdFromFront,
    selectedDate: null,
    effortFeel: null,
  };

  const enriched = enrichCaptureItem(base, projects);

  if (options.createProjectOnSave) {
    return {
      ...enriched,
      assignToProject: false,
      selectedProjectId: null,
      frontKeyOverride: options.frontKey,
      createProjectOnSave: true,
      captureRank: Date.now(),
    };
  }

  if (projectIdFromFront) {
    return {
      ...enriched,
      assignToProject: true,
      selectedProjectId: projectIdFromFront,
      frontKeyOverride: null,
      createProjectOnSave: false,
      captureRank: Date.now(),
    };
  }

  return {
    ...enriched,
    frontKeyOverride: options.frontKey,
    createProjectOnSave: false,
    captureRank: Date.now(),
  };
}
