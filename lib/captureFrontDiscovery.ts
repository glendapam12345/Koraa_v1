import type { CaptureFront } from '@/lib/captureProjectFronts';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

/** Quita planificación automática antes del paso de descubrimiento de frentes. */
export function stripAutoPlanningForDiscovery(
  items: EnrichedCaptureItem[],
): EnrichedCaptureItem[] {
  return items.map((item) => ({
    ...item,
    selectedDate: null,
    selectedCategory: '',
    effortFeel: null,
    assignToProject: false,
    selectedProjectId: null,
  }));
}

export function applyFrontDeadlinesToItems(
  items: EnrichedCaptureItem[],
  fronts: CaptureFront[],
  frontDeadlines: Record<string, string | null>,
): EnrichedCaptureItem[] {
  const itemFrontKey = new Map<string, string>();
  for (const front of fronts) {
    for (const task of front.tasks) {
      itemFrontKey.set(task.captureId, front.key);
    }
  }

  return items.map((item) => {
    const frontKey = itemFrontKey.get(item.id);
    if (!frontKey) return item;
    const date = frontDeadlines[frontKey];
    if (!date) return { ...item, selectedDate: null };
    return { ...item, selectedDate: date };
  });
}

export function itemsForFront(
  front: CaptureFront,
  items: EnrichedCaptureItem[],
): EnrichedCaptureItem[] {
  const ids = new Set(front.tasks.map((task) => task.captureId));
  return items.filter((item) => ids.has(item.id));
}
