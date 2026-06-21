import { THEME } from '@/constants/theme';
import { getProjectEmoji } from '@/lib/projectEmoji';
import type { LifeArea } from '@/lib/lifeAreas/types';

export const LOOSE_LIFE_AREA_ID = 'loose';

export function looseLifeArea(name: string): LifeArea {
  return {
    id: LOOSE_LIFE_AREA_ID,
    name,
    emoji: '📝',
    color: THEME.colors.text.tertiary,
  };
}

export function projectToLifeArea(project: {
  id: string;
  name: string;
  color: string | null;
}): LifeArea {
  return {
    id: project.id,
    name: project.name,
    emoji: getProjectEmoji(project.name),
    color: project.color || THEME.colors.gradient.blue,
  };
}

export function buildLifeAreaIndex(
  projects: { id: string; name: string; color: string | null }[],
  looseLabel: string,
): Map<string, LifeArea> {
  const map = new Map<string, LifeArea>();
  map.set(LOOSE_LIFE_AREA_ID, looseLifeArea(looseLabel));
  for (const project of projects) {
    map.set(project.id, projectToLifeArea(project));
  }
  return map;
}

export function resolveLifeArea(
  areaIndex: Map<string, LifeArea>,
  projectId: string | null,
): LifeArea {
  if (projectId && areaIndex.has(projectId)) {
    return areaIndex.get(projectId)!;
  }
  return areaIndex.get(LOOSE_LIFE_AREA_ID)!;
}
