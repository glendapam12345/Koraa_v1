import { useCallback, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { createVaciarTask, type VaciarCreateTaskResult } from '@/lib/vaciarCreateTask';
import { batchItemToDraft, type VaciarBatchItem } from '@/lib/vaciarBatchDraft';
import { logger } from '@/lib/logger';

export type SavedCaptureTask = {
  captureId: string;
  taskId: string;
  content: string;
  projectId: string | null;
};

export type BatchSaveResult = {
  tasks: SavedCaptureTask[];
  status: 'complete' | 'partial' | 'failed' | 'validation_failed';
};

type ToastFn = (message: string, type?: 'success' | 'error' | 'info') => void;

type UseVaciarBatchSaveArgs = {
  hasCheckInToday: boolean | null;
  showToast: ToastFn;
  onSaved: () => void | Promise<void>;
};

const ITEM_SAVE_TIMEOUT_MS = 12_000;

function withTimeout(
  promise: Promise<VaciarCreateTaskResult>,
  ms: number,
): Promise<VaciarCreateTaskResult> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve({ status: 'error' }), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

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
      options?: { suppressSuccessToast?: boolean },
    ): Promise<BatchSaveResult> => {
      const valid = items.filter((item) => item.content.trim());
      if (valid.length === 0) {
        showToast(t('vaciar.enterTask'), 'info');
        return { tasks: [], status: 'validation_failed' };
      }

      for (const item of valid) {
        if (item.assignToProject && !item.selectedProjectId) {
          showToast(t('vaciar.batchMissingProject', { task: item.content.slice(0, 40) }), 'info');
          return { tasks: [], status: 'validation_failed' };
        }
      }

      setIsSavingBatch(true);
      let savedCount = 0;
      let reprioritized = false;
      const savedTasks: SavedCaptureTask[] = [];

      const finishWithRefresh = async (
        status: BatchSaveResult['status'],
      ): Promise<BatchSaveResult> => {
        if (savedTasks.length > 0) {
          await onSaved();
        }
        return { tasks: savedTasks, status };
      };

      try {
        for (let index = 0; index < valid.length; index++) {
          const item = valid[index];
          const result = await withTimeout(
            createVaciarTask(batchItemToDraft(item), {
              locale,
              hasCheckInToday: Boolean(hasCheckInToday),
              skipReprioritize: index < valid.length - 1,
            }),
            ITEM_SAVE_TIMEOUT_MS,
          );

          if (result.status === 'not_authenticated') {
            showToast(t('errors.notAuthenticated'), 'error');
            return await finishWithRefresh(savedTasks.length > 0 ? 'partial' : 'failed');
          }
          if (result.status === 'error') {
            if (savedTasks.length > 0) {
              showToast(
                t('vaciar.batchPartialSave', {
                  saved: savedTasks.length,
                  total: valid.length,
                }),
                'info',
              );
            } else {
              showToast(t('errors.saveTaskFailed'), 'error');
            }
            return await finishWithRefresh(savedTasks.length > 0 ? 'partial' : 'failed');
          }

          if (result.taskId && item.effortFeel) {
            void import('@/lib/taskPerceivedEffort').then(({ setTaskEffort }) =>
              setTaskEffort(result.taskId as string, item.effortFeel!),
            );
          }

          if (result.taskId && (item.estimatedMinutes || item.preferredTime)) {
            void import('@/lib/taskPlanningMeta').then(({ setTaskPlanningMeta }) =>
              setTaskPlanningMeta(result.taskId as string, {
                energyRequired: 'normal',
                notes: '',
                ...(item.estimatedMinutes ? { estimatedMinutes: item.estimatedMinutes } : {}),
                preferredTime: item.preferredTime ?? null,
              }),
            );
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

        if (!options?.suppressSuccessToast) {
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

        return { tasks: savedTasks, status: 'complete' };
      } catch (error) {
        logger.error('Error guardando lote de tareas:', error);
        if (savedTasks.length > 0) {
          showToast(
            t('vaciar.batchPartialSave', { saved: savedTasks.length, total: valid.length }),
            'info',
          );
        } else {
          showToast(t('errors.saveTaskFailed'), 'error');
        }
        return await finishWithRefresh(savedTasks.length > 0 ? 'partial' : 'failed');
      } finally {
        setIsSavingBatch(false);
      }
    },
    [hasCheckInToday, locale, onSaved, showToast, t],
  );

  return { isSavingBatch, saveBatch };
}
