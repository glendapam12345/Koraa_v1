import type { LifeAreaKey } from './lifeAreaCatalog';
import {
  CUSTOM_LIFE_AREA_PREFIX,
  LIFE_AREA_CATALOG,
  isCustomLifeAreaRef,
  lifeAreaCatalogEntry,
  makeCustomLifeAreaRef,
  type LifeAreaRef,
} from './lifeAreaCatalog';

export type CustomLifeArea = {
  id: string;
  name: string;
  emoji: string;
};

export type UserLifeAreasConfig = {
  labels: Partial<Record<LifeAreaKey, string>>;
  custom: CustomLifeArea[];
};

export const EMPTY_USER_LIFE_AREAS: UserLifeAreasConfig = { labels: {}, custom: [] };

export type ResolvedLifeArea = {
  ref: LifeAreaRef;
  name: string;
  emoji: string;
  isCustom: boolean;
  catalogKey?: LifeAreaKey;
};

export function parseUserLifeAreasFromPreferences(
  otherPreferences: Record<string, unknown> | null | undefined,
): UserLifeAreasConfig {
  const raw = otherPreferences?.lifeAreas;
  if (!raw || typeof raw !== 'object') return EMPTY_USER_LIFE_AREAS;

  const obj = raw as Record<string, unknown>;
  const labels =
    obj.labels && typeof obj.labels === 'object'
      ? (obj.labels as Partial<Record<LifeAreaKey, string>>)
      : {};

  const customRaw = Array.isArray(obj.custom) ? obj.custom : [];
  const custom = customRaw
    .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object'))
    .map((entry) => ({
      id: String(entry.id ?? ''),
      name: String(entry.name ?? '').trim(),
      emoji: String(entry.emoji ?? '🌿'),
    }))
    .filter((entry) => entry.id.length > 0 && entry.name.length > 0);

  return { labels, custom };
}

export function mergeUserLifeAreasIntoPreferences(
  otherPreferences: Record<string, unknown>,
  config: UserLifeAreasConfig,
): Record<string, unknown> {
  return { ...otherPreferences, lifeAreas: config };
}

export function createCustomLifeArea(name: string, emoji = '🌿'): CustomLifeArea {
  const slug = Math.random().toString(36).slice(2, 8);
  return {
    id: `a${Date.now().toString(36)}${slug}`,
    name: name.trim(),
    emoji,
  };
}

export function resolveLifeAreaDisplay(
  ref: LifeAreaRef,
  config: UserLifeAreasConfig,
  getDefaultLabel?: (key: LifeAreaKey) => string,
): ResolvedLifeArea {
  if (isCustomLifeAreaRef(ref)) {
    const id = ref.slice(CUSTOM_LIFE_AREA_PREFIX.length);
    const entry = config.custom.find((item) => item.id === id);
    return {
      ref,
      name: entry?.name ?? '',
      emoji: entry?.emoji ?? '🌿',
      isCustom: true,
    };
  }

  const catalog = lifeAreaCatalogEntry(ref);
  const label = config.labels[ref] ?? getDefaultLabel?.(ref) ?? catalog.name;
  return {
    ref,
    name: label,
    emoji: catalog.emoji,
    isCustom: false,
    catalogKey: ref,
  };
}

export function groupProjectsByResolvedLifeArea<T extends { lifeAreaKey: LifeAreaRef }>(
  projects: T[],
  config: UserLifeAreasConfig,
  getDefaultLabel?: (key: LifeAreaKey) => string,
  fallbackAreaName = 'Otro',
): { area: ResolvedLifeArea; projects: T[] }[] {
  const buckets = new Map<string, T[]>();

  for (const project of projects) {
    const list = buckets.get(project.lifeAreaKey) ?? [];
    list.push(project);
    buckets.set(project.lifeAreaKey, list);
  }

  const groups: { area: ResolvedLifeArea; projects: T[] }[] = [];

  for (const catalogEntry of LIFE_AREA_CATALOG) {
    const bucket = buckets.get(catalogEntry.key);
    if (!bucket?.length) continue;
    groups.push({
      area: resolveLifeAreaDisplay(catalogEntry.key, config, getDefaultLabel),
      projects: bucket,
    });
    buckets.delete(catalogEntry.key);
  }

  for (const custom of config.custom) {
    const ref = makeCustomLifeAreaRef(custom.id);
    const bucket = buckets.get(ref);
    if (!bucket?.length) continue;
    groups.push({
      area: resolveLifeAreaDisplay(ref, config, getDefaultLabel),
      projects: bucket,
    });
    buckets.delete(ref);
  }

  for (const [ref, bucket] of buckets.entries()) {
    if (!bucket.length) continue;
    const area = resolveLifeAreaDisplay(ref as LifeAreaRef, config, getDefaultLabel);
    groups.push({
      area: {
        ...area,
        name: area.name || fallbackAreaName,
      },
      projects: bucket,
    });
  }

  return groups;
}

export function listSelectableLifeAreas(
  config: UserLifeAreasConfig,
  getDefaultLabel: (key: LifeAreaKey) => string,
): ResolvedLifeArea[] {
  const builtIn = LIFE_AREA_CATALOG.map((entry) =>
    resolveLifeAreaDisplay(entry.key, config, getDefaultLabel),
  );
  const custom = config.custom.map((entry) =>
    resolveLifeAreaDisplay(makeCustomLifeAreaRef(entry.id), config, getDefaultLabel),
  );
  return [...builtIn, ...custom];
}
