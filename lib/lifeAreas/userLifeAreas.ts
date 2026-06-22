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
import {
  resolveBuiltinAreaDisplayName,
  resolveCustomAreaDisplayName,
} from '@/lib/lifeAreas/areaDisplayLabels';
import { PROJECT_COLORS } from '@/lib/projectColors';
import { frontThemeForKey } from '@/lib/frentes/frontTheme';

export type CustomLifeArea = {
  id: string;
  name: string;
  emoji: string;
  color?: string;
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
  /** Áreas ocultas por la usuaria (built-in o preset); proyectos y tareas conservan su área. */
  hiddenAreaRefs?: LifeAreaRef[];
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
  color: string;
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
      color: typeof entry.color === 'string' && entry.color.trim() ? entry.color.trim() : undefined,
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

  const hiddenAreaRefs = Array.isArray(obj.hiddenAreaRefs)
    ? obj.hiddenAreaRefs.filter((entry): entry is LifeAreaRef => typeof entry === 'string')
    : undefined;

  return { labels, custom, examples, customExamples, columnOrder, hiddenAreaRefs };
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

export function isAreaHidden(config: UserLifeAreasConfig, ref: LifeAreaRef): boolean {
  return config.hiddenAreaRefs?.includes(ref) ?? false;
}

/** Si el área está oculta, devuelve la primera columna activa (p. ej. Otro). */
export function resolveActiveLifeAreaRef(
  ref: LifeAreaRef,
  config: UserLifeAreasConfig,
): LifeAreaRef {
  if (!isAreaHidden(config, ref)) return ref;
  const active = resolveAreaColumnOrder(config);
  return active[0] ?? 'other';
}

export function hideAreaInConfig(config: UserLifeAreasConfig, ref: LifeAreaRef): UserLifeAreasConfig {
  const hidden = new Set(config.hiddenAreaRefs ?? []);
  hidden.add(ref);
  return {
    ...config,
    hiddenAreaRefs: [...hidden],
    columnOrder: config.columnOrder?.filter((entry) => entry !== ref),
  };
}

export function resolveAreaColumnOrder(config: UserLifeAreasConfig): LifeAreaRef[] {
  const fallback = defaultAreaColumnOrder(config);
  const stored = config.columnOrder?.filter(
    (ref) => isLifeAreaKey(ref) || isCustomLifeAreaRef(ref),
  );
  let ordered: LifeAreaRef[];
  if (!stored?.length) {
    ordered = fallback;
  } else {
    const known = new Set(fallback);
    ordered = stored.filter((ref) => known.has(ref));
    for (const ref of fallback) {
      if (!ordered.includes(ref)) ordered.push(ref);
    }
  }
  return ordered.filter((ref) => !isAreaHidden(config, ref));
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

export function canDeleteCustomAreaId(customId: string): boolean {
  return !isBrainDumpPresetCustomId(customId);
}

export function removeCustomAreaFromConfig(
  config: UserLifeAreasConfig,
  customId: string,
): UserLifeAreasConfig | null {
  if (!canDeleteCustomAreaId(customId)) return null;

  const ref = makeCustomLifeAreaRef(customId);
  const customExamples = { ...(config.customExamples ?? {}) };
  delete customExamples[customId];

  return {
    ...config,
    custom: config.custom.filter((entry) => entry.id !== customId),
    columnOrder: config.columnOrder?.filter((entry) => entry !== ref),
    customExamples,
  };
}

/** Quita un área del tablero: borra custom de usuario u oculta built-in / preset. */
export function removeAreaFromUserConfig(
  config: UserLifeAreasConfig,
  ref: LifeAreaRef,
): UserLifeAreasConfig {
  if (isCustomLifeAreaRef(ref)) {
    const customId = ref.slice(CUSTOM_LIFE_AREA_PREFIX.length);
    const removed = removeCustomAreaFromConfig(config, customId);
    if (removed) return removed;
  }
  return hideAreaInConfig(config, ref);
}

export function defaultCustomAreaColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % PROJECT_COLORS.length;
  }
  return PROJECT_COLORS[hash] ?? PROJECT_COLORS[0];
}

export function createCustomLifeArea(
  name: string,
  emoji = '🌿',
  color?: string,
): CustomLifeArea {
  const slug = Math.random().toString(36).slice(2, 8);
  const id = `a${Date.now().toString(36)}${slug}`;
  return {
    id,
    name: name.trim(),
    emoji,
    color: color ?? defaultCustomAreaColor(id),
  };
}

export function resolveLifeAreaDisplay(
  ref: LifeAreaRef,
  config: UserLifeAreasConfig,
  getDefaultLabel?: (key: LifeAreaKey) => string,
  translatePresetCustom?: (presetCustomId: string) => string,
): ResolvedLifeArea {
  if (isCustomLifeAreaRef(ref)) {
    const id = ref.slice(CUSTOM_LIFE_AREA_PREFIX.length);
    const entry = config.custom.find((item) => item.id === id);
    return {
      ref,
      name: resolveCustomAreaDisplayName(id, entry?.name, translatePresetCustom),
      emoji: entry?.emoji ?? '🌿',
      color: entry?.color ?? defaultCustomAreaColor(id),
      isCustom: true,
    };
  }

  const catalog = lifeAreaCatalogEntry(ref);
  const label = resolveBuiltinAreaDisplayName(ref, config.labels[ref], getDefaultLabel);
  const catalogIndex = LIFE_AREA_CATALOG.findIndex((entry) => entry.key === ref);
  return {
    ref,
    name: label,
    emoji: catalog.emoji,
    color: frontThemeForKey(ref, catalogIndex >= 0 ? catalogIndex : 0).accent,
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

/** Orden de columnas en la vista Áreas: activas + Otros siempre al final. */
export function resolveAreasPanelColumnOrder(
  config: UserLifeAreasConfig,
  includeRef?: LifeAreaRef | null,
): LifeAreaRef[] {
  const activeOrder = resolveAreaColumnOrder(config);
  const mainRefs = activeOrder.filter((ref) => ref !== 'other');
  const ordered: LifeAreaRef[] = [...mainRefs, 'other'];

  if (includeRef && includeRef !== 'other' && !ordered.includes(includeRef)) {
    ordered.splice(ordered.length - 1, 0, includeRef);
  }

  return ordered;
}

/** Áreas visibles en la vista Áreas y en pickers alineados con ella. */
export function listActiveLifeAreas(
  config: UserLifeAreasConfig,
  getDefaultLabel: (key: LifeAreaKey) => string,
  getPresetCustomLabel?: (presetCustomId: string) => string,
  includeRef?: LifeAreaRef | null,
): ResolvedLifeArea[] {
  return resolveAreasPanelColumnOrder(config, includeRef).map((ref) =>
    resolveLifeAreaDisplay(ref, config, getDefaultLabel, getPresetCustomLabel),
  );
}

/** Catálogo completo (legacy): todas las built-in + custom, sin filtrar activas. */
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
