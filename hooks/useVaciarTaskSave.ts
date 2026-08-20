import { useState, useCallback } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { getLocalDateString } from '@/lib/dateLocal';
import { logger } from '@/lib/logger';
import {
  promptDeviceCalendarPermission,
  syncSavedTaskToDeviceCalendar,
} from '@/lib/deviceCalendar';
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
    async (
      draft: VaciarTaskDraft,
      options?: {
        effortFeel?: TaskEffort | null;
        reliefCapture?: boolean;
        suppressToast?: boolean;
        estimatedMinutes?: number | null;
        preferredTime?: string | null;
      },
    ): Promise<{ ok: true; taskId?: string } | { ok: false }> => {
      const validation = validateVaciarTaskDraft(draft);
      if (validation === 'empty') {
        showToast(t('vaciar.enterTask'), 'info');
        return { ok: false };
      }
      if (validation === 'no_project') {
        showToast(t('vaciar.selectProject'), 'info');
        return { ok: false };
      }
      if (validation === 'task_too_long') {
        showToast(t('vaciar.taskTooLong'), 'error');
        return { ok: false };
      }
      if (validation === 'no_subtasks') {
        showToast(t('vaciar.addSubtaskOrDisable'), 'info');
        return { ok: false };
      }
      if (validation === 'subtask_too_long') {
        showToast(t('vaciar.subtaskTooLong'), 'error');
        return { ok: false };
      }

      setIsSaving(true);
      try {
        const result = await createVaciarTask(draft, {
          locale,
          hasCheckInToday: Boolean(hasCheckInToday),
          skipReprioritize: true,
        });

        if (result.status === 'not_authenticated') {
          showToast(t('errors.notAuthenticated'), 'error');
          return { ok: false };
        }
        if (result.status === 'error') {
          showToast(t('errors.saveTaskFailed'), 'error');
          return { ok: false };
        }
        if (result.taskId && options?.effortFeel) {
          void setTaskEffort(result.taskId, options.effortFeel);
        }

        if (
          result.taskId &&
          (options?.estimatedMinutes || options?.preferredTime)
        ) {
          void import('@/lib/taskPlanningMeta').then(({ setTaskPlanningMeta }) =>
            setTaskPlanningMeta(result.taskId as string, {
              energyRequired: 'normal',
              notes: '',
              ...(options.estimatedMinutes ? { estimatedMinutes: options.estimatedMinutes } : {}),
              preferredTime: options.preferredTime ?? null,
            }),
          );
        }

        void syncSavedTaskToDeviceCalendar({
          taskId: result.taskId,
          title: result.savedTitle,
          scheduledDate: result.savedScheduledDate,
          eventNotes: t('deviceCalendar.eventNotes'),
        }).then((calendarSync) => {
          if (calendarSync === 'permission_denied') {
            promptDeviceCalendarPermission({
              permissionTitle: t('deviceCalendar.permissionTitle'),
              permissionBody: t('deviceCalendar.permissionBody'),
              cancel: t('deviceCalendar.cancel'),
              openSettings: t('deviceCalendar.openSettings'),
            });
          }
        });

        if (result.status === 'offline') {
          await onSaved({
            savedTitle: result.savedTitle,
            savedScheduledDate: result.savedScheduledDate,
            subtaskCount: result.subtaskCount,
            reprioritized: false,
            hasSubtasks: result.hasSubtasks,
          });
          showToast(t('vaciar.savedOffline'), 'info');
          return { ok: true, taskId: result.taskId };
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
          return { ok: true, taskId: result.taskId };
        }

        let toastMsg = result.hasSubtasks
          ? t('vaciarExtra.toastWithSubtasks', {
              count: result.subtaskCount,
              suffix: t('vaciarExtra.toastWithSubtasksSuccess'),
            })
          : options?.reliefCapture
            ? `${t('vaciar.releaseConfirmOne')}\n${t('vaciar.releaseRelief')}`
            : result.savedScheduledDate
            ? t('vaciarExtra.toastAddedWithDate', {
                  date: formatSavedDate(result.savedScheduledDate),
                })
            : t('vaciarExtra.toastAdded');

        if (result.reprioritized) {
          toastMsg = `${toastMsg} ${t('vaciar.suggestionsUpdatedToast')}`;
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

        if (!options?.suppressToast) {
          showToast(toastMsg, result.reprioritized || !hasCheckInToday ? 'info' : 'success');
        }
        return { ok: true, taskId: result.taskId };
      } catch (error) {
        logger.error('Error inesperado:', error);
        showToast(t('errors.saveTaskFailed'), 'error');
        return { ok: false };
      } finally {
        setIsSaving(false);
      }
    },
    [formatSavedDate, hasCheckInToday, locale, onSaved, showToast, t],
  );

  return { isSaving, saveTask };
}
