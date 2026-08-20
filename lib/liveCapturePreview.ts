import type { AppLocale } from '@/lib/i18n';
import { enrichCaptureItemsLocally } from '@/lib/taskIntelligentEnrichment';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import { parseCaptureToInboxItems } from '@/lib/vaciarInboxCapture';
import type { ProjectForMatch } from '@/lib/batchProjectMatch';
import type { VaciarBatchItem } from '@/lib/vaciarBatchDraft';
import { applyInferredLifeAreas } from '@/lib/review/inferCaptureItemLifeArea';
import type { UserLifeAreasConfig } from '@/lib/lifeAreas/userLifeAreas';
import { ensureBrainDumpPresetInConfig } from '@/lib/review/brainDumpAreaPreset';
import {
  buildLiveAreaPreviewColumns,
  type LiveAreaPreviewChip,
  type LiveAreaPreviewColumn,
} from '@/lib/review/buildLiveAreaPreviewSummary';

export type LiveCapturePreview = {
  items: EnrichedCaptureItem[];
  areaChips: LiveAreaPreviewChip[];
  areaColumns: LiveAreaPreviewColumn[];
};

function stableLiveItemId(content: string, index: number): string {
  const norm = content.trim().toLowerCase();
  const slug = norm.slice(0, 48).replace(/\s+/g, '-');
  return `live-${index}-${slug}`;
}

function withStableLiveIds(items: VaciarBatchItem[]): VaciarBatchItem[] {
  const seen = new Map<string, number>();
  return items.map((item, index) => {
    const norm = item.content.trim().toLowerCase();
    const dup = seen.get(norm) ?? 0;
    seen.set(norm, dup + 1);
    const id =
      dup === 0
        ? stableLiveItemId(item.content, index)
        : `${stableLiveItemId(item.content, index)}-${dup}`;
    return { ...item, id };
  });
}

/** Organización local instantánea por áreas — sin IA ni red (preview en vivo). */
export function buildLiveCapturePreview(
  rawInput: string,
  locale: AppLocale,
  projects: ProjectForMatch[],
  options?: { stableIds?: boolean; lifeAreasConfig?: UserLifeAreasConfig },
): LiveCapturePreview | null {
  const trimmed = rawInput.trim();
  if (trimmed.length < 4) return null;

  try {
    const parsed = parseCaptureToInboxItems(trimmed, locale);
    if (parsed.length === 0) return null;

    const rows = options?.stableIds ? withStableLiveIds(parsed) : parsed;
    const effectiveConfig = options?.lifeAreasConfig
      ? ensureBrainDumpPresetInConfig(options.lifeAreasConfig)
      : undefined;
    let items = enrichCaptureItemsLocally(rows, projects);
    items = applyInferredLifeAreas(items, effectiveConfig);
    const areaColumns = buildLiveAreaPreviewColumns(items, locale, effectiveConfig);

    return {
      items,
      areaColumns,
      areaChips: areaColumns.map(({ previews: _previews, ...chip }) => chip),
    };
  } catch {
    return null;
  }
}
