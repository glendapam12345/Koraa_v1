import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

/**
 * Quita planificación automática antes del paso de organización por áreas.
 * Conserva `selectedDate` (usuario o inferida) para que Calendario/Hoy las vean al guardar.
 */
export function stripAutoPlanningForDiscovery(
  items: EnrichedCaptureItem[],
): EnrichedCaptureItem[] {
  return items.map((item) => ({
    ...item,
    selectedCategory: '',
    effortFeel: null,
    assignToProject: false,
    selectedProjectId: null,
  }));
}
