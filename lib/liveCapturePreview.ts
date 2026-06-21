import type { AppLocale } from '@/lib/i18n';
import { buildCaptureFronts, type CaptureFrontsResult } from '@/lib/captureProjectFronts';
import { enrichCaptureItemsLocally } from '@/lib/taskIntelligentEnrichment';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import { parseCaptureToInboxItems } from '@/lib/vaciarInboxCapture';
import type { ProjectForMatch } from '@/lib/batchProjectMatch';
import type { VaciarBatchItem } from '@/lib/vaciarBatchDraft';

export type LiveCapturePreview = {
  items: EnrichedCaptureItem[];
  fronts: CaptureFrontsResult;
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

/** Organización local instantánea — sin IA ni red (para preview en vivo). */
export function buildLiveCapturePreview(
  rawInput: string,
  locale: AppLocale,
  projects: ProjectForMatch[],
  options?: { stableIds?: boolean },
): LiveCapturePreview | null {
  const trimmed = rawInput.trim();
  if (trimmed.length < 4) return null;

  const parsed = parseCaptureToInboxItems(trimmed, locale);
  if (parsed.length === 0) return null;

  const rows = options?.stableIds ? withStableLiveIds(parsed) : parsed;
  const items = enrichCaptureItemsLocally(rows, projects);
  const projectsMeta = projects.map((p) => ({
    id: p.id,
    name: p.name,
    due_date: null as string | null,
  }));

  return {
    items,
    fronts: buildCaptureFronts(items, projectsMeta),
  };
}
