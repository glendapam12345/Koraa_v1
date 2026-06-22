import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { Task } from '@/hooks/useTasks';
import { getLocalDateString } from '@/lib/dateLocal';
import { postponeTaskFromToday } from '@/lib/hoy/postponeTaskFromToday';
import {
  applyHoyPlanOrder,
  ensureOrderForTasks,
  loadHoyPlanOrder,
  saveHoyPlanOrder,
  swapInOrder,
} from '@/lib/hoyFocusTaskOrder';

type UseHoyPlanTaskActionsOptions = {
  focusTasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onTasksReload?: () => void | Promise<void>;
  postponeSuccessMessage: string;
};

export function useHoyPlanTaskActions({
  focusTasks,
  setTasks,
  showToast,
  onTasksReload,
  postponeSuccessMessage,
}: UseHoyPlanTaskActionsOptions) {
  const today = getLocalDateString();
  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    void loadHoyPlanOrder(today).then((stored) => {
      if (active) setOrder(stored);
    });
    return () => {
      active = false;
    };
  }, [today]);

  const incompleteFocusTasks = useMemo(
    () => focusTasks.filter((task) => !task.is_completed),
    [focusTasks],
  );

  useEffect(() => {
    setOrder((prev) => {
      const next = ensureOrderForTasks(prev, incompleteFocusTasks);
      return next.join(',') === prev.join(',') ? prev : next;
    });
  }, [incompleteFocusTasks]);

  const orderedFocusTasks = useMemo(() => {
    const normalized = ensureOrderForTasks(order, incompleteFocusTasks);
    return applyHoyPlanOrder(incompleteFocusTasks, normalized);
  }, [incompleteFocusTasks, order]);

  const handlePostpone = useCallback(
    async (taskId: string) => {
      const result = await postponeTaskFromToday(taskId);
      if (!result.ok) {
        showToast(result.error, 'error');
        return;
      }

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...task, is_priority: false, scheduled_date: result.scheduledDate }
            : task,
        ),
      );

      const nextOrder = order.filter((id) => id !== taskId);
      setOrder(nextOrder);
      await saveHoyPlanOrder(today, nextOrder);
      showToast(postponeSuccessMessage, 'success');
      void onTasksReload?.();
    },
    [onTasksReload, order, postponeSuccessMessage, setTasks, showToast, today],
  );

  const handleMove = useCallback(
    async (taskId: string, direction: 'up' | 'down') => {
      const baseOrder = ensureOrderForTasks(order, incompleteFocusTasks);
      const nextOrder = swapInOrder(baseOrder, taskId, direction);
      if (!nextOrder) return;
      setOrder(nextOrder);
      await saveHoyPlanOrder(today, nextOrder);
    },
    [incompleteFocusTasks, order, today],
  );

  return {
    orderedFocusTasks,
    handlePostpone,
    handleMove,
  };
}
