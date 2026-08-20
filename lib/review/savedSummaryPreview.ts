import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import type { SavedCaptureTask } from '@/hooks/useVaciarBatchSave';
import {
  capturePriorityToIsPriority,
  resolveCapturePriority,
} from '@/lib/review/capturePriority';
import type { SavedSummaryPreviewItem } from '@/lib/review/buildBrainDumpSavedSummary';

export function buildSavedPreviewItems(
  items: EnrichedCaptureItem[],
  savedTasks: SavedCaptureTask[] = [],
): SavedSummaryPreviewItem[] {
  const taskIdByCaptureId = new Map(savedTasks.map((entry) => [entry.captureId, entry.taskId]));

  return items.map((item) => {
    const priority = resolveCapturePriority(item);
    return {
      captureId: item.id,
      taskId: taskIdByCaptureId.get(item.id) ?? null,
      content: item.content,
      lifeAreaKey: item.lifeAreaKey ?? null,
      projectId: item.assignToProject ? item.selectedProjectId : null,
      scheduledDate: item.selectedDate,
      estimatedMinutes: item.estimatedMinutes ?? null,
      preferredTime: item.preferredTime ?? null,
      capturePriority: priority,
      isPriority: capturePriorityToIsPriority(priority),
    };
  });
}

export function savedPreviewToEnrichedItem(item: SavedSummaryPreviewItem): EnrichedCaptureItem {
  return {
    id: item.captureId ?? `saved-${item.taskId ?? item.content}`,
    content: item.content,
    assignToProject: Boolean(item.projectId),
    selectedCategory: 'otros',
    selectedProjectId: item.projectId,
    selectedDate: item.scheduledDate ?? null,
    effortFeel: null,
    lifeAreaKey: item.lifeAreaKey,
    estimatedMinutes: item.estimatedMinutes ?? null,
    preferredTime: item.preferredTime ?? null,
    timing: 'today',
    capturePriority: item.capturePriority ?? null,
    markImportant: item.isPriority ?? false,
  };
}

export function enrichedToSavedPreviewItem(
  item: EnrichedCaptureItem,
  previous: SavedSummaryPreviewItem,
): SavedSummaryPreviewItem {
  const priority = resolveCapturePriority(item);
  return {
    ...previous,
    content: item.content,
    lifeAreaKey: item.lifeAreaKey ?? null,
    projectId: item.assignToProject ? item.selectedProjectId : null,
    scheduledDate: item.selectedDate,
    estimatedMinutes: item.estimatedMinutes ?? null,
    preferredTime: item.preferredTime ?? null,
    capturePriority: priority,
    isPriority: capturePriorityToIsPriority(priority),
  };
}
