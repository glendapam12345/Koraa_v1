import type { AppLocale } from '@/lib/i18n';
import {
  formatProposalDeadlineLabel,
  formatProposalScheduleLabel,
} from '@/lib/lifeAreas/experienceDataMappers';
import { formatDurationLabel } from '@/lib/taskPlanningMeta';
import { getLifeAreaAccentColor } from '@/lib/lifeAreas/lifeAreaColors';
import { makeCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { isCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { LOOSE_LIFE_AREA_ID, looseLifeArea } from '@/lib/lifeAreas/projectToLifeArea';
import type { LifeArea, WeekPlannerTask } from '@/lib/lifeAreas/types';
import {
  isBrainDumpPresetCustomId,
  getBrainDumpColumnRefs,
} from '@/lib/review/brainDumpAreaPreset';
import {
  projectsForLifeArea,
  type BrainDumpReviewProject,
} from '@/lib/review/brainDumpProjects';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import {
  inferAreaContextEmoji,
  inferAreaContextLabel,
} from '@/lib/review/inferAreaContextLabel';
import {
  resolveLifeAreaDisplay,
  resolveAreaColumnOrder,
  type UserLifeAreasConfig,
} from '@/lib/lifeAreas/userLifeAreas';
import type { LifeAreaKey } from '@/lib/lifeAreas/lifeAreaCatalog';

export type BrainDumpProjectGroup = {
  id: string;
  name: string;
  dueDateLabel?: string;
  isDraft?: boolean;
  color?: string;
  tasks: WeekPlannerTask[];
};

export type BrainDumpAreaColumn = {
  id: string;
  ref: LifeAreaRef | null;
  name: string;
  emoji: string;
  color: string;
  isLoose: boolean;
  /** Solo en columnas de área (no sueltas). */
  projectGroups: BrainDumpProjectGroup[];
  /** Columna global de sueltas — lista plana. */
  tasks: WeekPlannerTask[];
};

export function captureItemToPlannerTask(
  item: EnrichedCaptureItem,
  locale: AppLocale,
): WeekPlannerTask {
  const columnId = item.lifeAreaKey ?? LOOSE_LIFE_AREA_ID;
  return {
    id: item.id,
    title: item.content,
    areaId: columnId,
    iconEmoji: '',
    timeLabel: item.selectedDate
      ? formatProposalScheduleLabel(item.selectedDate, locale)
      : '',
    durationLabel: item.estimatedMinutes ? formatDurationLabel(item.estimatedMinutes) : '',
    status: item.markImportant ? 'star' : 'pending',
    scheduledDate: item.selectedDate ?? '',
  };
}

function listReviewColumnRefs(config: UserLifeAreasConfig): (LifeAreaRef | typeof LOOSE_LIFE_AREA_ID)[] {
  return [...resolveAreaColumnOrder(config), LOOSE_LIFE_AREA_ID];
}

function resolvedColumnMeta(
  columnId: string,
  config: UserLifeAreasConfig,
  getDefaultLabel: (key: LifeAreaKey) => string,
  looseLabel: string,
  colorIndex: number,
  translatePresetCustom?: (presetCustomId: string) => string,
): Omit<BrainDumpAreaColumn, 'tasks' | 'projectGroups'> {
  if (columnId === LOOSE_LIFE_AREA_ID) {
    const loose = looseLifeArea(looseLabel);
    return {
      id: LOOSE_LIFE_AREA_ID,
      ref: null,
      name: loose.name,
      emoji: loose.emoji,
      color: loose.color,
      isLoose: true,
    };
  }

  const ref = columnId as LifeAreaRef;
  const resolved = resolveLifeAreaDisplay(ref, config, getDefaultLabel, translatePresetCustom);
  return {
    id: ref,
    ref,
    name: resolved.name,
    emoji: resolved.emoji,
    color: getLifeAreaAccentColor(ref, colorIndex, config),
    isLoose: false,
  };
}

function buildProjectGroupsForArea(
  areaRef: LifeAreaRef,
  areaItems: EnrichedCaptureItem[],
  projects: BrainDumpReviewProject[],
  locale: AppLocale,
  looseInAreaLabel: string,
): BrainDumpProjectGroup[] {
  const areaProjects = projectsForLifeArea(projects, areaRef);
  const groups: BrainDumpProjectGroup[] = [];

  for (const project of areaProjects) {
    const projectItems = areaItems.filter(
      (item) => item.assignToProject && item.selectedProjectId === project.id,
    );
    groups.push({
      id: project.id,
      name: project.name,
      dueDateLabel: formatProposalDeadlineLabel(project.due_date, locale),
      isDraft: project.isDraft,
      color: project.color,
      tasks: projectItems.map((item) => captureItemToPlannerTask(item, locale)),
    });
  }

  const looseInArea = areaItems.filter(
    (item) => !item.assignToProject || !item.selectedProjectId,
  );
  if (looseInArea.length > 0) {
    groups.push({
      id: `loose-in-${areaRef}`,
      name: looseInAreaLabel,
      tasks: looseInArea.map((item) => captureItemToPlannerTask(item, locale)),
    });
  }

  return groups;
}

export function buildBrainDumpAreaBoardModel(
  items: EnrichedCaptureItem[],
  config: UserLifeAreasConfig,
  getDefaultLabel: (key: LifeAreaKey) => string,
  looseLabel: string,
  locale: AppLocale,
  projects: BrainDumpReviewProject[] = [],
  looseInAreaLabel = 'Sin proyecto',
  stableColumnLabels = false,
  translatePresetCustom?: (presetCustomId: string) => string,
): { columns: BrainDumpAreaColumn[]; areas: LifeArea[]; countsLine: string } {
  const columnRefs = listReviewColumnRefs(config);
  const itemsByColumn = new Map<string, EnrichedCaptureItem[]>();

  for (const ref of columnRefs) {
    itemsByColumn.set(ref, []);
  }

  for (const item of items) {
    const rawColumnId = item.lifeAreaKey ?? LOOSE_LIFE_AREA_ID;
    const columnId = itemsByColumn.has(rawColumnId) ? rawColumnId : LOOSE_LIFE_AREA_ID;
    itemsByColumn.get(columnId)!.push(item);
  }

  const columns: BrainDumpAreaColumn[] = columnRefs.map((columnId, index) => {
    const meta = resolvedColumnMeta(
      columnId,
      config,
      getDefaultLabel,
      looseLabel,
      index,
      translatePresetCustom,
    );
    const columnItems = itemsByColumn.get(columnId) ?? [];
    const taskRows = columnItems.map((item) => ({ content: item.content }));

    const displayName =
      !stableColumnLabels && columnItems.length > 0 && !meta.isLoose
        ? inferAreaContextLabel(taskRows, locale, meta.name)
        : meta.name;
    const displayEmoji =
      !stableColumnLabels && columnItems.length > 0 && !meta.isLoose
        ? inferAreaContextEmoji(taskRows, meta.emoji)
        : meta.emoji;

    if (meta.isLoose || !meta.ref) {
      return {
        ...meta,
        name: displayName,
        emoji: displayEmoji,
        projectGroups: [],
        tasks: columnItems.map((item) => captureItemToPlannerTask(item, locale)),
      };
    }

    return {
      ...meta,
      name: displayName,
      emoji: displayEmoji,
      projectGroups: buildProjectGroupsForArea(
        meta.ref,
        columnItems,
        projects,
        locale,
        looseInAreaLabel,
      ),
      tasks: [],
    };
  });

  const areas: LifeArea[] = columns.map((column) => ({
    id: column.id,
    name: column.name,
    emoji: column.emoji,
    color: column.color,
  }));

  const countParts = columns
    .filter((column) => !column.isLoose)
    .map((column) => {
      const count =
        column.projectGroups.reduce((sum, group) => sum + group.tasks.length, 0) +
        column.tasks.length;
      return count > 0 ? `${count} ${column.name.toLowerCase()}` : null;
    })
    .filter(Boolean) as string[];

  const looseCount = columns.find((column) => column.isLoose)?.tasks.length ?? 0;
  if (looseCount > 0) {
    countParts.push(`${looseCount} ${looseLabel.toLowerCase()}`);
  }

  return {
    columns,
    areas,
    countsLine: countParts.join(' · '),
  };
}

export function columnIdToLifeAreaKey(columnId: string): LifeAreaRef | null {
  if (columnId === LOOSE_LIFE_AREA_ID) return null;
  return columnId as LifeAreaRef;
}

export function countTasksInColumn(column: BrainDumpAreaColumn): number {
  if (column.isLoose) return column.tasks.length;
  return column.projectGroups.reduce((sum, group) => sum + group.tasks.length, 0);
}

/** Proyectos guardados o borradores en la columna (excluye grupo «sueltas en área»). */
export function columnHasSavedProjectGroups(column: BrainDumpAreaColumn): boolean {
  if (column.isLoose) return false;
  return column.projectGroups.some((group) => !group.id.startsWith('loose-in-'));
}

export function isUserAddedCustomAreaColumn(column: BrainDumpAreaColumn): boolean {
  if (column.isLoose || !column.ref) return false;
  if (!isCustomLifeAreaRef(column.ref)) return false;
  const customId = column.ref.slice('custom:'.length);
  return !isBrainDumpPresetCustomId(customId);
}

/** Columnas con tareas, áreas personalizadas vacías, o áreas con proyectos ya guardados. */
export function filterVisibleBrainDumpAreaColumns(
  columns: BrainDumpAreaColumn[],
  projects: BrainDumpReviewProject[] = [],
): BrainDumpAreaColumn[] {
  return columns.filter((column) => {
    if (countTasksInColumn(column) > 0) return true;
    if (isUserAddedCustomAreaColumn(column)) return true;
    if (column.ref && projectsForLifeArea(projects, column.ref).length > 0) return true;
    return false;
  });
}

export function filterPopulatedBrainDumpColumns(columns: BrainDumpAreaColumn[]): BrainDumpAreaColumn[] {
  return columns.filter((column) => countTasksInColumn(column) > 0);
}

export function splitBrainDumpBoardColumns(columns: BrainDumpAreaColumn[]): {
  looseColumn: BrainDumpAreaColumn | null;
  areaColumns: BrainDumpAreaColumn[];
} {
  const looseColumn = columns.find((column) => column.isLoose) ?? null;
  const areaColumns = columns.filter((column) => !column.isLoose);
  return { looseColumn, areaColumns };
}
