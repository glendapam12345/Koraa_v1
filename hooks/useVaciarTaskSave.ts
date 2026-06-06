import { useState, useCallback } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { getLocalDateString } from '@/lib/dateLocal';
import { logger } from '@/lib/logger';
import {
  createVaciarTask,
  validateVaciarTaskDraft,
  type VaciarTaskDraft,
} from '@/lib/vaciarCreateTask';
import { setTaskEffort, type TaskEffort } from '@/lib/taskPerceivedEffort';

type ToastFn = (message: string, type?: 'success' | 'error' | 'info') => void;

type UseVaciarTaskSaveArgs = {
  hasCheckInToday: boolean | null;
  showToast: ToastFn;
  onSaved: (result: {
    savedTitle: string;
    savedScheduledDate: string | null;
    subtaskCount: number;
    reprioritized: boolean;
    hasSubtasks: boolean;
  }) => void | Promise<void>;
};

export function useVaciarTaskSave({
  hasCheckInToday,
  showToast,
  onSaved,
}: UseVaciarTaskSaveArgs) {
  const { t, locale } = useI18n();
  const [isSaving, setIsSaving] = useState(false);

  const formatSavedDate = useCallback(
    (dateStr: string) => {
      const monthNames =
        locale === 'en'
          ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          : ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const todayStr = getLocalDateString();
      if (dateStr === todayStr) return t('components.today');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (dateStr === getLocalDateString(tomorrow)) return t('components.tomorrow');
      const day = dateStr.slice(8);
      const month = monthNames[parseInt(dateStr.slice(5, 7), 10) - 1];
      return `${day} ${month}`;
    },
    [locale, t],
  );

  const saveTask = useCallback(
    async (draft: VaciarTaskDraft, options?: { effortFeel?: TaskEffort | null }) => {
      const validation = validateVaciarTaskDraft(draft);
      if (validation === 'empty') {
        showToast(t('vaciar.enterTask'), 'info');
        return;
      }
      if (validation === 'no_project') {
        showToast(t('vaciar.selectProject'), 'info');
        return;
      }
      if (validation === 'task_too_long') {
        showToast(t('vaciar.taskTooLong'), 'error');
        return;
      }
      if (validation === 'no_subtasks') {
        showToast(t('vaciar.addSubtaskOrDisable'), 'info');
        return;
      }
      if (validation === 'subtask_too_long') {
        showToast(t('vaciar.subtaskTooLong'), 'error');
        return;
      }

      setIsSaving(true);
      try {
        const result = await createVaciarTask(draft, {
          locale,
          hasCheckInToday: Boolean(hasCheckInToday),
        });

        if (result.status === 'not_authenticated') {
          showToast(t('errors.notAuthenticated'), 'error');
          return;
        }
        if (result.status === 'error') {
          showToast(t('errors.saveTaskFailed'), 'error');
          return;
        }
        if (result.taskId && options?.effortFeel) {
          await setTaskEffort(result.taskId, options.effortFeel);
        }

        if (result.status === 'offline') {
          await onSaved({
            savedTitle: result.savedTitle,
            savedScheduledDate: result.savedScheduledDate,
            subtaskCount: result.subtaskCount,
            reprioritized: false,
            hasSubtasks: result.hasSubtasks,
          });
          showToast(t('vaciar.savedOffline'), 'info');
          return;
        }
        if (result.status === 'partial') {
          await onSaved({
            savedTitle: result.savedTitle,
            savedScheduledDate: result.savedScheduledDate,
            subtaskCount: result.subtaskCount,
            reprioritized: false,
            hasSubtasks: result.hasSubtasks,
          });
          showToast(t('vaciar.savedPartial'), 'success');
          return;
        }

        let toastMsg = result.hasSubtasks
          ? t('vaciarExtra.toastWithSubtasks', {
              count: result.subtaskCount,
              priority: t('vaciarExtra.toastWithSubtasksSuccess'),
            })
          : result.savedScheduledDate
            ? t('vaciarExtra.toastAddedWithDate', {
                date: formatSavedDate(result.savedScheduledDate),
              })
            : t('vaciarExtra.toastAdded');

        if (result.reprioritized) {
          toastMsg = `${toastMsg} ${t('vaciar.reprioritizedToast')}`;
        } else if (!hasCheckInToday) {
          toastMsg = t('vaciarExtra.toastAddedGoFeel');
        }

        await onSaved({
          savedTitle: result.savedTitle,
          savedScheduledDate: result.savedScheduledDate,
          subtaskCount: result.subtaskCount,
          reprioritized: result.reprioritized,
          hasSubtasks: result.hasSubtasks,
        });

        showToast(toastMsg, result.reprioritized || !hasCheckInToday ? 'info' : 'success');
      } catch (error) {
        logger.error('Error inesperado:', error);
        showToast(t('errors.saveTaskFailed'), 'error');
      } finally {
        setIsSaving(false);
      }
    },
    [formatSavedDate, hasCheckInToday, locale, onSaved, showToast, t],
  );

  return { isSaving, saveTask };
}
