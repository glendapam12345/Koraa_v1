import type { Task } from '@/components/tasks/TaskCard';
import type { LifeAreaKey } from '@/lib/lifeAreas/lifeAreaCatalog';
import {
  isCustomLifeAreaRef,
  isLifeAreaKey,
  resolveProjectLifeAreaKey,
  type LifeAreaRef,
} from '@/lib/lifeAreas/lifeAreaCatalog';
import type { HoyProjectInfo } from '@/lib/hoy/focusTaskDisplay';
import {
  resolveAreaColumnOrder,
  resolveLifeAreaDisplay,
  type ResolvedLifeArea,
  type UserLifeAreasConfig,
} from '@/lib/lifeAreas/userLifeAreas';

export type HoyPlanAreaGroup = {
  area: ResolvedLifeArea;
  tasks: Task[];
};

function areaSortIndex(ref: LifeAreaRef, columnOrder: LifeAreaRef[]): number {
  const index = columnOrder.indexOf(ref);
  return index >= 0 ? index : columnOrder.length + 1;
}

export function resolveHoyTaskAreaRef(
  task: Pick<Task, 'project_id' | 'life_area_key'>,
  projectsMap: Record<string, HoyProjectInfo>,
): LifeAreaRef {
  if (task.project_id && projectsMap[task.project_id]) {
    const project = projectsMap[task.project_id];
    return resolveProjectLifeAreaKey(project.life_area_key ?? null, project.name);
  }

  const looseKey = task.life_area_key;
  if (looseKey && (isLifeAreaKey(looseKey) || isCustomLifeAreaRef(looseKey))) {
    return looseKey;
  }

  return 'other';
}

/** Agrupa pasos del plan de hoy por área de vida — solo áreas con tareas. */
export function buildHoyPlanAreaGroups(
  tasks: Task[],
  projectsMap: Record<string, HoyProjectInfo>,
  config: UserLifeAreasConfig,
  getDefaultLabel: (key: LifeAreaKey) => string,
  translatePresetCustom?: (presetCustomId: string) => string,
): HoyPlanAreaGroup[] {
  const columnOrder = resolveAreaColumnOrder(config);
  const buckets = new Map<LifeAreaRef, Task[]>();

  for (const task of tasks) {
    const ref = resolveHoyTaskAreaRef(task, projectsMap);
    const list = buckets.get(ref) ?? [];
    list.push(task);
    buckets.set(ref, list);
  }

  const groups: HoyPlanAreaGroup[] = [];
  for (const [ref, areaTasks] of buckets) {
    if (areaTasks.length === 0) continue;
    groups.push({
      area: resolveLifeAreaDisplay(ref, config, getDefaultLabel, translatePresetCustom),
      tasks: areaTasks,
    });
  }

  return groups.sort(
    (a, b) =>
      areaSortIndex(a.area.ref as LifeAreaRef, columnOrder) -
      areaSortIndex(b.area.ref as LifeAreaRef, columnOrder),
  );
}
