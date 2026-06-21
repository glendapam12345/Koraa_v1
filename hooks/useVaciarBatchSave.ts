import { useCallback, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { createVaciarTask } from '@/lib/vaciarCreateTask';
import { batchItemToDraft, type VaciarBatchItem } from '@/lib/vaciarBatchDraft';
import { logger } from '@/lib/logger';

export type SavedCaptureTask = {
  captureId: string;
  taskId: string;
  content: string;
  projectId: string | null;
};

type ToastFn = (message: string, type?: 'success' | 'error' | 'info') => void;

type UseVaciarBatchSaveArgs = {
  hasCheckInToday: boolean | null;
  showToast: ToastFn;
  onSaved: () => void | Promise<void>;
};

export function useVaciarBatchSave({
  hasCheckInToday,
  showToast,
  onSaved,
}: UseVaciarBatchSaveArgs) {
  const { t, locale } = useI18n();
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  const saveBatch = useCallback(
    async (
      items: VaciarBatchItem[],
      options?: { suppressToast?: boolean },
    ): Promise<SavedCaptureTask[] | null> => {
      const valid = items.filter((item) => item.content.trim());
      if (valid.length === 0) {
        showToast(t('vaciar.enterTask'), 'info');
        return null;
      }

      for (const item of valid) {
        if (item.assignToProject && !item.selectedProjectId) {
          showToast(t('vaciar.batchMissingProject', { task: item.content.slice(0, 40) }), 'info');
          return null;
        }
      }

      setIsSavingBatch(true);
      let savedCount = 0;
      let reprioritized = false;
      const savedTasks: SavedCaptureTask[] = [];

      try {
        for (const item of valid) {
          const result = await createVaciarTask(batchItemToDraft(item), {
            locale,
            hasCheckInToday: Boolean(hasCheckInToday),
          });

          if (result.status === 'not_authenticated') {
            showToast(t('errors.notAuthenticated'), 'error');
            return null;
          }
          if (result.status === 'error') {
            showToast(t('errors.saveTaskFailed'), 'error');
            return null;
          }

          if (result.taskId && item.effortFeel) {
            const { setTaskEffort } = await import('@/lib/taskPerceivedEffort');
            await setTaskEffort(result.taskId, item.effortFeel);
          }

          if (result.taskId) {
            savedTasks.push({
              captureId: item.id,
              taskId: result.taskId,
              content: item.content,
              projectId: item.assignToProject ? item.selectedProjectId : null,
            });
          }

          savedCount += 1;
          if (result.reprioritized) reprioritized = true;
        }

        await onSaved();

        if (!options?.suppressToast) {
          const countLine =
            savedCount === 1
              ? t('vaciar.releaseConfirmOne')
              : t('vaciar.releaseConfirm', { count: savedCount });
          let toastMsg = `${countLine}\n${t('vaciar.releaseRelief')}`;
          if (reprioritized) {
            toastMsg = `${toastMsg} ${t('vaciar.suggestionsUpdatedToast')}`;
          } else if (!hasCheckInToday) {
            toastMsg = `${toastMsg}\n${t('vaciarExtra.toastAddedGoFeel')}`;
          }
          showToast(toastMsg, reprioritized || !hasCheckInToday ? 'info' : 'success');
        }

        return savedTasks;
      } catch (error) {
        logger.error('Error guardando lote de tareas:', error);
        showToast(t('errors.saveTaskFailed'), 'error');
        return null;
      } finally {
        setIsSavingBatch(false);
      }
    },
    [hasCheckInToday, locale, onSaved, showToast, t],
  );

  return { isSavingBatch, saveBatch };
}
