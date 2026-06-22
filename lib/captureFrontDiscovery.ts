import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

/** Quita planificación automática antes del paso de organización por áreas. */
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
