import { useCallback } from 'react';
import { ReviewPreviewTaskRow } from '@/components/frentes/ReviewPreviewTaskRow';
import type { AppLocale } from '@/lib/i18n';
import type { SavedSummaryPreviewItem } from '@/lib/review/buildBrainDumpSavedSummary';
import {
  enrichedToSavedPreviewItem,
  savedPreviewToEnrichedItem,
} from '@/lib/review/savedSummaryPreview';
import { saveTaskPlanEdit } from '@/lib/vnext/saveTaskPlanEdit';
import { getDefaultPlanningMeta } from '@/lib/taskPlanningMeta';
import {
  capturePriorityToIsPriority,
  resolveCapturePriority,
} from '@/lib/review/capturePriority';

type SavedSummaryEditableTaskRowProps = {
  item: SavedSummaryPreviewItem;
  locale: AppLocale;
  onUpdated: (item: SavedSummaryPreviewItem) => void;
  onRequestMoveArea: () => void;
  onSaveError?: (message: string) => void;
};

export function SavedSummaryEditableTaskRow({
  item,
  locale,
  onUpdated,
  onRequestMoveArea,
  onSaveError,
}: SavedSummaryEditableTaskRowProps) {
  const enriched = savedPreviewToEnrichedItem(item);

  const persist = useCallback(
    async (nextPreview: SavedSummaryPreviewItem) => {
      if (!nextPreview.taskId) {
        onUpdated(nextPreview);
        return;
      }
      const nextEnriched = savedPreviewToEnrichedItem(nextPreview);
      const priority = resolveCapturePriority(nextEnriched);
      const result = await saveTaskPlanEdit({
        taskId: nextPreview.taskId,
        content: nextEnriched.content,
        scheduledDate: nextEnriched.selectedDate,
        projectId: nextEnriched.assignToProject ? nextEnriched.selectedProjectId : null,
        effort: nextEnriched.effortFeel,
        planning: {
          ...getDefaultPlanningMeta(),
          estimatedMinutes: nextEnriched.estimatedMinutes ?? undefined,
          preferredTime: nextEnriched.preferredTime ?? undefined,
        },
        isPriority: capturePriorityToIsPriority(priority),
        lifeAreaKey: nextEnriched.lifeAreaKey ?? null,
      });
      if (!result.ok) {
        onSaveError?.(result.error);
        return;
      }
      onUpdated(nextPreview);
    },
    [onSaveError, onUpdated],
  );

  const handleChange = useCallback(
    (next: ReturnType<typeof savedPreviewToEnrichedItem>) => {
      const nextPreview = enrichedToSavedPreviewItem(next, item);
      void persist(nextPreview);
    },
    [item, persist],
  );

  return (
    <ReviewPreviewTaskRow
      item={enriched}
      locale={locale}
      compact
      canMove={Boolean(item.taskId)}
      hideDelete
      onChange={handleChange}
      onRequestMove={onRequestMoveArea}
      onDelete={() => undefined}
    />
  );
}
