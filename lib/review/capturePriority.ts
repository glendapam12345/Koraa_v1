import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

export type CapturePriority = 'low' | 'medium' | 'high' | 'urgent';

export const CAPTURE_PRIORITY_ORDER: CapturePriority[] = ['low', 'medium', 'high', 'urgent'];

export function capturePriorityToIsPriority(priority: CapturePriority | null | undefined): boolean {
  return priority === 'high' || priority === 'urgent';
}

export function isUrgentCapturePriority(priority: CapturePriority | null | undefined): boolean {
  return priority === 'urgent';
}

export function resolveCapturePriority(item: EnrichedCaptureItem): CapturePriority | null {
  if (item.capturePriority) return item.capturePriority;
  if (item.markImportant) return 'high';
  return null;
}

export function applyCapturePriority(
  item: EnrichedCaptureItem,
  priority: CapturePriority,
): EnrichedCaptureItem {
  return {
    ...item,
    capturePriority: priority,
    markImportant: capturePriorityToIsPriority(priority),
  };
}

export function clearCapturePriority(item: EnrichedCaptureItem): EnrichedCaptureItem {
  return {
    ...item,
    capturePriority: null,
    markImportant: false,
  };
}
