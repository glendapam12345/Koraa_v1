import type { AppLocale, TranslationKey } from '@/lib/i18n';
import { translate } from '@/lib/i18n';
import type { LifeAreaKey, LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import {
  EMPTY_USER_LIFE_AREAS,
  resolveLifeAreaDisplay,
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

function groupItemsByArea(items: EnrichedCaptureItem[]): Map<LifeAreaRef, EnrichedCaptureItem[]> {
  const groups = new Map<LifeAreaRef, EnrichedCaptureItem[]>();
  for (const item of items) {
    const ref = item.lifeAreaKey ?? inferCaptureItemLifeArea(item.content);
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
): LiveAreaPreviewColumn {
  const config = ensureBrainDumpPresetInConfig(EMPTY_USER_LIFE_AREAS);
  const getDefaultLabel = (key: LifeAreaKey) =>
    translate(locale, `lifeAreas.${key}` as TranslationKey);
  const resolved = resolveLifeAreaDisplay(ref, config, getDefaultLabel);
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
): LiveAreaPreviewColumn[] {
  return [...groupItemsByArea(items).entries()]
    .map(([ref, groupItems]) => buildAreaPreviewEntry(ref, groupItems, locale))
    .sort((a, b) => b.count - a.count);
}

export function buildLiveAreaPreviewSummary(
  items: EnrichedCaptureItem[],
  locale: AppLocale,
): LiveAreaPreviewChip[] {
  return buildLiveAreaPreviewColumns(items, locale).map(({ previews: _previews, ...chip }) => chip);
}
