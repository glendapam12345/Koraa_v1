import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { inferLifeAreaKeyForProject } from '@/lib/lifeAreas/lifeAreaCatalog';
import { PROJECT_COLORS } from '@/lib/projectColors';

export type BrainDumpReviewProject = {
  id: string;
  name: string;
  lifeAreaKey: LifeAreaRef;
  due_date: string | null;
  color?: string;
  notes?: string;
  /** Creado en revisión — aún no está en la BD. */
  isDraft?: boolean;
};

export function createDraftBrainDumpProject(
  name: string,
  lifeAreaKey: LifeAreaRef,
  dueDate: string | null = null,
): BrainDumpReviewProject {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    lifeAreaKey,
    due_date: dueDate,
    color: PROJECT_COLORS[0],
    isDraft: true,
  };
}

export function toBrainDumpReviewProject(row: {
  id: string;
  name: string;
  due_date?: string | null;
  color?: string | null;
  life_area_key?: string | null;
  notes?: string | null;
}): BrainDumpReviewProject {
  return {
    id: row.id,
    name: row.name,
    due_date: row.due_date ?? null,
    color: row.color ?? undefined,
    lifeAreaKey: (row.life_area_key as LifeAreaRef | null) ?? inferLifeAreaKeyForProject(row.name),
    notes: row.notes ?? undefined,
    isDraft: false,
  };
}

export function mergeBrainDumpProjects(
  existing: BrainDumpReviewProject[],
  drafts: BrainDumpReviewProject[],
): BrainDumpReviewProject[] {
  const byId = new Map<string, BrainDumpReviewProject>();
  for (const project of existing) {
    byId.set(project.id, project);
  }
  for (const draft of drafts) {
    byId.set(draft.id, draft);
  }
  return [...byId.values()];
}

export function projectsForLifeArea(
  projects: BrainDumpReviewProject[],
  areaRef: LifeAreaRef,
): BrainDumpReviewProject[] {
  return projects.filter((project) => project.lifeAreaKey === areaRef);
}

export function isDraftProjectId(id: string): boolean {
  return id.startsWith('draft-');
}

export function assignItemToProject(
  assign: boolean,
  projectId: string | null,
): { assignToProject: boolean; selectedProjectId: string | null } {
  if (!assign || !projectId) {
    return { assignToProject: false, selectedProjectId: null };
  }
  return { assignToProject: true, selectedProjectId: projectId };
}
