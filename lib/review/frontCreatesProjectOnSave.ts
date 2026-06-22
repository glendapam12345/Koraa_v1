import type { CaptureFront } from '@/lib/captureProjectFronts';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

export function frontCreatesProjectOnSave(
  front: CaptureFront,
  items: EnrichedCaptureItem[],
): boolean {
  if (front.projectId || front.isExistingProject) return false;
  if (front.suggestedNewProject) return true;
  const ids = new Set(front.tasks.map((task) => task.captureId));
  return items.some((item) => ids.has(item.id) && item.createProjectOnSave);
}
