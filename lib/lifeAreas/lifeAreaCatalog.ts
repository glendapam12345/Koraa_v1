import { INFERRED_FRONT_PATTERNS } from '@/lib/captureProjectFronts';

export type LifeAreaKey = 'koraa' | 'impermanence' | 'marathon' | 'personal' | 'other';

export type LifeAreaCatalogEntry = {
  key: LifeAreaKey;
  name: string;
  emoji: string;
};

export const LIFE_AREA_CATALOG: LifeAreaCatalogEntry[] = [
  ...INFERRED_FRONT_PATTERNS.map((pattern) => ({
    key: pattern.key as LifeAreaKey,
    name: pattern.name.replace(/\s+App$/i, ''),
    emoji: pattern.emoji,
  })),
  { key: 'other', name: 'Otro', emoji: '🌿' },
];

export function isLifeAreaKey(value: string | null | undefined): value is LifeAreaKey {
  return LIFE_AREA_CATALOG.some((entry) => entry.key === value);
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** Infiere área a partir del nombre del proyecto si no hay clave guardada. */
export function inferLifeAreaKeyForProject(name: string): LifeAreaKey {
  const lower = normalizeText(name);

  for (const pattern of INFERRED_FRONT_PATTERNS) {
    if (normalizeText(pattern.name) === lower) return pattern.key as LifeAreaKey;
    for (const keyword of pattern.keywords) {
      if (lower.includes(normalizeText(keyword))) {
        return pattern.key as LifeAreaKey;
      }
    }
  }

  return 'other';
}

export function resolveProjectLifeAreaKey(
  stored: string | null | undefined,
  projectName: string,
): LifeAreaKey {
  if (stored && isLifeAreaKey(stored)) return stored;
  return inferLifeAreaKeyForProject(projectName);
}

export function lifeAreaCatalogEntry(key: LifeAreaKey): LifeAreaCatalogEntry {
  return LIFE_AREA_CATALOG.find((entry) => entry.key === key) ?? LIFE_AREA_CATALOG[LIFE_AREA_CATALOG.length - 1];
}

export function groupProjectsByLifeArea<T extends { lifeAreaKey: LifeAreaKey }>(
  projects: T[],
): { area: LifeAreaCatalogEntry; projects: T[] }[] {
  const buckets = new Map<LifeAreaKey, T[]>();

  for (const project of projects) {
    const list = buckets.get(project.lifeAreaKey) ?? [];
    list.push(project);
    buckets.set(project.lifeAreaKey, list);
  }

  return LIFE_AREA_CATALOG.map((area) => ({
    area,
    projects: buckets.get(area.key) ?? [],
  })).filter((group) => group.projects.length > 0);
}
