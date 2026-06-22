import type { LifeAreaKey } from './lifeAreaCatalog';
import {
  CUSTOM_LIFE_AREA_PREFIX,
  LIFE_AREA_CATALOG,
  isCustomLifeAreaRef,
  isLifeAreaKey,
  lifeAreaCatalogEntry,
  makeCustomLifeAreaRef,
  type LifeAreaRef,
} from './lifeAreaCatalog';
import { isBrainDumpPresetCustomId, getBrainDumpColumnRefs } from '@/lib/review/brainDumpAreaPreset';

export type CustomLifeArea = {
  id: string;
  name: string;
  emoji: string;
};

export type UserLifeAreasConfig = {
  labels: Partial<Record<LifeAreaKey, string>>;
  custom: CustomLifeArea[];
  /** Ejemplos por área built-in — ayuda a inferir al capturar. */
  examples?: Partial<Record<LifeAreaKey, string>>;
  /** Ejemplos por área custom (id sin prefijo custom:). */
  customExamples?: Record<string, string>;
  /** Orden de columnas de área (sin sueltas). */
  columnOrder?: LifeAreaRef[];
};

export const EMPTY_USER_LIFE_AREAS: UserLifeAreasConfig = {
  labels: {},
  custom: [],
  examples: {},
  customExamples: {},
};

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

  const examples =
    obj.examples && typeof obj.examples === 'object'
      ? (obj.examples as Partial<Record<LifeAreaKey, string>>)
      : {};

  const customExamples =
    obj.customExamples && typeof obj.customExamples === 'object'
      ? (obj.customExamples as Record<string, string>)
      : {};

  const columnOrder = Array.isArray(obj.columnOrder)
    ? obj.columnOrder.filter((entry): entry is LifeAreaRef => typeof entry === 'string')
    : undefined;

  return { labels, custom, examples, customExamples, columnOrder };
}

function exampleTokens(text: string): string[] {
  return text
    .split(/[,;\n]+/)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 1);
}

/** Infiere área según ejemplos que el usuario definió en onboarding o ajustes. */
export function inferLifeAreaFromUserExamples(
  content: string,
  config: UserLifeAreasConfig,
): LifeAreaRef | null {
  const lower = content.toLowerCase();
  let bestRef: LifeAreaRef | null = null;
  let bestScore = 0;

  const scoreRef = (ref: LifeAreaRef, examplesText: string | undefined) => {
    if (!examplesText?.trim()) return;
    const hits = exampleTokens(examplesText).filter((token) => lower.includes(token)).length;
    if (hits > bestScore) {
      bestScore = hits;
      bestRef = ref;
    }
  };

  for (const entry of LIFE_AREA_CATALOG) {
    scoreRef(entry.key, config.examples?.[entry.key]);
  }

  for (const custom of config.custom) {
    scoreRef(
      makeCustomLifeAreaRef(custom.id),
      config.customExamples?.[custom.id],
    );
  }

  return bestScore > 0 ? bestRef : null;
}

export function defaultAreaColumnOrder(config: UserLifeAreasConfig): LifeAreaRef[] {
  const preset = getBrainDumpColumnRefs();
  const extra = config.custom
    .filter((entry) => !isBrainDumpPresetCustomId(entry.id))
    .map((entry) => makeCustomLifeAreaRef(entry.id));
  return [...preset, ...extra];
}

export function resolveAreaColumnOrder(config: UserLifeAreasConfig): LifeAreaRef[] {
  const fallback = defaultAreaColumnOrder(config);
  const stored = config.columnOrder?.filter(
    (ref) => isLifeAreaKey(ref) || isCustomLifeAreaRef(ref),
  );
  if (!stored?.length) return fallback;

  const known = new Set(fallback);
  const ordered = stored.filter((ref) => known.has(ref));
  for (const ref of fallback) {
    if (!ordered.includes(ref)) ordered.push(ref);
  }
  return ordered;
}

export function reorderAreaColumnInConfig(
  config: UserLifeAreasConfig,
  ref: LifeAreaRef,
  direction: 'up' | 'down',
): UserLifeAreasConfig {
  const order = resolveAreaColumnOrder(config);
  const index = order.indexOf(ref);
  if (index < 0) return config;

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= order.length) return config;

  const next = [...order];
  [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  return { ...config, columnOrder: next };
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
