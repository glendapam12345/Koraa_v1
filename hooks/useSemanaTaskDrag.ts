import { useCallback, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { rescheduleTask } from '@/lib/taskReplan';

type ToastType = 'success' | 'error' | 'info';

type UseSemanaTaskDragOptions = {
  showToast: (message: string, type?: ToastType) => void;
  onTasksChanged: () => void;
};

export function useSemanaTaskDrag({ showToast, onTasksChanged }: UseSemanaTaskDragOptions) {
  const { t } = useI18n();
  const [moving, setMoving] = useState(false);

  const moveTaskToDay = useCallback(
    async (taskId: string, targetDayId: string): Promise<{ ok: boolean }> => {
      setMoving(true);
      try {
        const { error } = await rescheduleTask(taskId, targetDayId);
        if (error) {
          showToast(t('semanaExtra.taskMovedError'), 'error');
          return { ok: false };
        }
        showToast(t('semanaExtra.taskMovedSuccess'), 'success');
        onTasksChanged();
        return { ok: true };
      } finally {
        setMoving(false);
      }
    },
    [onTasksChanged, showToast, t],
  );

  return { moveTaskToDay, moving };
}
