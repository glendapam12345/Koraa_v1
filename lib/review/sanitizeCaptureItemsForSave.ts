import { assignItemToProject } from '@/lib/review/brainDumpProjects';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

/** Evita que el guardado falle por asignaciones de proyecto incompletas. */
export function sanitizeCaptureItemsForSave(items: EnrichedCaptureItem[]): EnrichedCaptureItem[] {
  return items.map((item) => {
    if (item.assignToProject && !item.selectedProjectId) {
      return { ...item, ...assignItemToProject(false, null) };
    }
    return item;
  });
}
