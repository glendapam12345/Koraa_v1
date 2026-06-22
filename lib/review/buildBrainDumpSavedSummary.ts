import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import type { ProjectLibraryItem } from '@/hooks/useProjectsLibrary';
import {
  resolveAreaColumnOrder,
  resolveLifeAreaDisplay,
  type ResolvedLifeArea,
  type UserLifeAreasConfig,
} from '@/lib/lifeAreas/userLifeAreas';
import type { LifeAreaKey } from '@/lib/lifeAreas/lifeAreaCatalog';
import type { LooseTaskSummary } from '@/lib/looseTasks';

export type SavedSummaryPreviewItem = {
  content: string;
  lifeAreaKey: LifeAreaRef | null;
  projectId: string | null;
  scheduledDate?: string | null;
  estimatedMinutes?: number | null;
};

export type SavedOrganizedContext = {
  taskCount: number;
  newProjectIds: string[];
  affectedAreaRefs: LifeAreaRef[];
  /** Pasos guardados en esta sesión — para el preview inmediato. */
  previewItems: SavedSummaryPreviewItem[];
};

export type SavedSummaryAreaGroup = {
  area: ResolvedLifeArea;
  projects: ProjectLibraryItem[];
  looseTasks: SavedSummaryPreviewItem[];
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
  _looseTasks: LooseTaskSummary[],
  context: SavedOrganizedContext,
  _fallbackAreaName: string,
  translatePresetCustom?: (presetCustomId: string) => string,
): SavedSummaryAreaGroup[] {
  const columnOrder = resolveAreaColumnOrder(config);
  const newProjectIds = new Set(context.newProjectIds);
  const previewItems = context.previewItems;
  const affectedRefs =
    context.affectedAreaRefs.length > 0
      ? context.affectedAreaRefs
      : [
          ...new Set(
            previewItems
              .map((item) => item.lifeAreaKey)
              .filter((ref): ref is LifeAreaRef => ref != null),
          ),
        ];

  const groups: SavedSummaryAreaGroup[] = [];

  for (const ref of affectedRefs) {
    const areaItems = previewItems.filter((item) => item.lifeAreaKey === ref);
    if (areaItems.length === 0) continue;

    const looseTasks = areaItems.filter((item) => !item.projectId);
    const projectIdsInBatch = new Set(
      areaItems.map((item) => item.projectId).filter((id): id is string => Boolean(id)),
    );

    const areaProjects = projects.filter(
      (project) =>
        project.lifeAreaKey === ref &&
        (projectIdsInBatch.has(project.id) || newProjectIds.has(project.id)),
    );

    groups.push({
      area: resolveLifeAreaDisplay(ref, config, getDefaultLabel, translatePresetCustom),
      projects: areaProjects,
      looseTasks,
      looseCount: looseTasks.length,
      hasNewProject: areaProjects.some((project) => newProjectIds.has(project.id)),
    });
  }

  return groups.sort(
    (a, b) =>
      areaSortIndex(a.area.ref as LifeAreaRef, columnOrder) -
      areaSortIndex(b.area.ref as LifeAreaRef, columnOrder),
  );
}
