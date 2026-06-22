import type { AppLocale, TranslationKey } from '@/lib/i18n';
import { translate } from '@/lib/i18n';
import type { LifeAreaKey, LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import {
  EMPTY_USER_LIFE_AREAS,
  resolveAreaColumnOrder,
  resolveLifeAreaDisplay,
  type UserLifeAreasConfig,
} from '@/lib/lifeAreas/userLifeAreas';
import { ensureBrainDumpPresetInConfig } from '@/lib/review/brainDumpAreaPreset';
import { inferCaptureItemLifeArea } from '@/lib/review/inferCaptureItemLifeArea';
import {
  inferAreaContextEmoji,
  inferAreaContextLabel,
} from '@/lib/review/inferAreaContextLabel';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

export type LiveAreaPreviewChip = {
  ref: LifeAreaRef;
  emoji: string;
  label: string;
  count: number;
};

export type LiveAreaPreviewColumn = LiveAreaPreviewChip & {
  previews: string[];
};

const MAX_TASK_PREVIEWS = 4;
const PREVIEW_CHAR_LIMIT = 52;

function truncatePreview(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= PREVIEW_CHAR_LIMIT) return trimmed;
  return `${trimmed.slice(0, PREVIEW_CHAR_LIMIT - 1).trim()}…`;
}

function groupItemsByArea(
  items: EnrichedCaptureItem[],
  config?: UserLifeAreasConfig,
): Map<LifeAreaRef, EnrichedCaptureItem[]> {
  const groups = new Map<LifeAreaRef, EnrichedCaptureItem[]>();
  for (const item of items) {
    const ref =
      item.lifeAreaKey ?? inferCaptureItemLifeArea(item.content, config);
    const bucket = groups.get(ref);
    if (bucket) bucket.push(item);
    else groups.set(ref, [item]);
  }
  return groups;
}

function buildAreaPreviewEntry(
  ref: LifeAreaRef,
  groupItems: EnrichedCaptureItem[],
  locale: AppLocale,
  config: UserLifeAreasConfig,
): LiveAreaPreviewColumn {
  const getDefaultLabel = (key: LifeAreaKey) =>
    translate(locale, `lifeAreas.${key}` as TranslationKey);
  const translatePresetCustom = (presetCustomId: string) =>
    translate(locale, `lifeAreasPreset.${presetCustomId}` as TranslationKey);
  const resolved = resolveLifeAreaDisplay(ref, config, getDefaultLabel, translatePresetCustom);
  const taskRows = groupItems.map((item) => ({ content: item.content }));

  return {
    ref,
    emoji: inferAreaContextEmoji(taskRows, resolved.emoji),
    label: inferAreaContextLabel(taskRows, locale, resolved.name),
    count: groupItems.length,
    previews: groupItems.slice(0, MAX_TASK_PREVIEWS).map((item) => truncatePreview(item.content)),
  };
}

export function buildLiveAreaPreviewColumns(
  items: EnrichedCaptureItem[],
  locale: AppLocale,
  lifeAreasConfig?: UserLifeAreasConfig,
): LiveAreaPreviewColumn[] {
  const config = ensureBrainDumpPresetInConfig(lifeAreasConfig ?? EMPTY_USER_LIFE_AREAS);
  const activeRefs = resolveAreaColumnOrder(config);
  const grouped = groupItemsByArea(items, config);

  const columns = activeRefs
    .map((ref) => {
      const groupItems = grouped.get(ref);
      if (!groupItems?.length) return null;
      return buildAreaPreviewEntry(ref, groupItems, locale, config);
    })
    .filter((column): column is LiveAreaPreviewColumn => column != null);

  const coveredRefs = new Set(columns.map((column) => column.ref));
  for (const [ref, groupItems] of grouped) {
    if (coveredRefs.has(ref) || groupItems.length === 0) continue;
    columns.push(buildAreaPreviewEntry(ref, groupItems, locale, config));
  }

  return columns;
}

export function buildLiveAreaPreviewSummary(
  items: EnrichedCaptureItem[],
  locale: AppLocale,
  lifeAreasConfig?: UserLifeAreasConfig,
): LiveAreaPreviewChip[] {
  return buildLiveAreaPreviewColumns(items, locale, lifeAreasConfig).map(
    ({ previews: _previews, ...chip }) => chip,
  );
}
