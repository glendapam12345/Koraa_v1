import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

/** Conserva ediciones manuales de la revisión al llegar un refinado de IA u otra actualización. */
export function mergeCaptureReviewEdits(
  previous: EnrichedCaptureItem[],
  incoming: EnrichedCaptureItem[],
): EnrichedCaptureItem[] {
  const byId = new Map(previous.map((item) => [item.id, item]));
  const seen = new Set<string>();

  const merged = incoming.map((item) => {
    seen.add(item.id);
    const prev = byId.get(item.id);
    if (!prev) return item;
    return mergeCaptureReviewItem(prev, item);
  });

  for (const item of previous) {
    if (!seen.has(item.id)) {
      merged.push(item);
    }
  }

  return merged;
}

/** Respeta `null` explícito (p. ej. usuario quitó hora) — `??` no lo haría. */
function pickMergedNullable<T>(
  prev: T | null | undefined,
  incoming: T | null | undefined,
): T | null | undefined {
  if (prev !== undefined) return prev;
  return incoming;
}

function mergeCaptureReviewItem(
  prev: EnrichedCaptureItem,
  incoming: EnrichedCaptureItem,
): EnrichedCaptureItem {
  return {
    ...incoming,
    content: prev.content,
    lifeAreaKey: prev.lifeAreaKey != null ? prev.lifeAreaKey : incoming.lifeAreaKey,
    selectedDate: prev.selectedDate ?? incoming.selectedDate,
    estimatedMinutes: pickMergedNullable(prev.estimatedMinutes, incoming.estimatedMinutes),
    preferredTime: pickMergedNullable(prev.preferredTime, incoming.preferredTime),
    markImportant: prev.markImportant ?? incoming.markImportant,
    capturePriority: prev.capturePriority ?? incoming.capturePriority,
    assignToProject: prev.assignToProject,
    selectedProjectId: prev.selectedProjectId,
    effortFeel: prev.effortFeel ?? incoming.effortFeel,
    selectedCategory: prev.selectedCategory || incoming.selectedCategory,
    frontKeyOverride: prev.frontKeyOverride ?? incoming.frontKeyOverride,
    createProjectOnSave: prev.createProjectOnSave ?? incoming.createProjectOnSave,
    captureRank: prev.captureRank ?? incoming.captureRank,
  };
}
