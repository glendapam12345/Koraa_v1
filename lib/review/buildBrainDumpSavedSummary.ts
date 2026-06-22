import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { getBrainDumpColumnRefs } from '@/lib/review/brainDumpAreaPreset';
import type { ProjectLibraryItem } from '@/hooks/useProjectsLibrary';
import {
  groupProjectsByResolvedLifeArea,
  resolveLifeAreaDisplay,
  type ResolvedLifeArea,
  type UserLifeAreasConfig,
} from '@/lib/lifeAreas/userLifeAreas';
import type { LifeAreaKey } from '@/lib/lifeAreas/lifeAreaCatalog';
import type { LooseTaskSummary } from '@/lib/looseTasks';
import { groupLooseTasksByArea } from '@/lib/looseTasks';

export type SavedOrganizedContext = {
  taskCount: number;
  newProjectIds: string[];
  affectedAreaRefs: LifeAreaRef[];
};

export type SavedSummaryAreaGroup = {
  area: ResolvedLifeArea;
  projects: ProjectLibraryItem[];
  looseCount: number;
  hasNewProject: boolean;
};

function areaSortIndex(ref: LifeAreaRef, columnOrder: LifeAreaRef[]): number {
  const index = columnOrder.indexOf(ref);
  return index >= 0 ? index : columnOrder.length + 1;
}

export function buildSavedSummaryAreaGroups(
  projects: ProjectLibraryItem[],
  config: UserLifeAreasConfig,
  getDefaultLabel: (key: LifeAreaKey) => string,
  looseTasks: LooseTaskSummary[],
  context: SavedOrganizedContext,
  fallbackAreaName: string,
): SavedSummaryAreaGroup[] {
  const columnOrder = getBrainDumpColumnRefs();
  const newProjectIds = new Set(context.newProjectIds);
  const affectedRefs = new Set(context.affectedAreaRefs);
  const looseByArea = groupLooseTasksByArea(looseTasks);

  const grouped = groupProjectsByResolvedLifeArea(
    projects,
    config,
    getDefaultLabel,
    fallbackAreaName,
  );

  const byRef = new Map<string, SavedSummaryAreaGroup>();
  for (const group of grouped) {
    byRef.set(group.area.ref, {
      area: group.area,
      projects: group.projects,
      looseCount: looseByArea.get(group.area.ref)?.length ?? 0,
      hasNewProject: group.projects.some((project) => newProjectIds.has(project.id)),
    });
  }

  for (const ref of context.affectedAreaRefs) {
    if (byRef.has(ref)) continue;
    const looseCount = looseByArea.get(ref)?.length ?? 0;
    const areaProjects = projects.filter((project) => project.lifeAreaKey === ref);
    if (looseCount === 0 && areaProjects.length === 0) continue;

    byRef.set(ref, {
      area: resolveLifeAreaDisplay(ref, config, getDefaultLabel),
      projects: areaProjects,
      looseCount,
      hasNewProject: areaProjects.some((project) => newProjectIds.has(project.id)),
    });
  }

  return [...byRef.values()]
    .filter(
      (group) =>
        group.projects.length > 0 ||
        group.looseCount > 0 ||
        affectedRefs.has(group.area.ref as LifeAreaRef),
    )
    .sort(
      (a, b) =>
        areaSortIndex(a.area.ref as LifeAreaRef, columnOrder) -
        areaSortIndex(b.area.ref as LifeAreaRef, columnOrder),
    );
}
