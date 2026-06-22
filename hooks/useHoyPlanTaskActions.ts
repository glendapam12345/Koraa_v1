import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { Task } from '@/hooks/useTasks';
import { getLocalDateString } from '@/lib/dateLocal';
import { postponeTaskFromToday } from '@/lib/hoy/postponeTaskFromToday';
import { setTaskPriorityFlag } from '@/lib/hoy/setTaskPriorityFlag';
import {
  HOY_PLAN_COLUMN_PRIORITY,
  HOY_PLAN_COLUMN_WAITING,
} from '@/lib/hoy/hoyPlanColumns';
import {
  applyHoyPlanOrder,
  ensureOrderForTasks,
  loadHoyPlanOrder,
  saveHoyPlanOrder,
  swapInOrder,
} from '@/lib/hoyFocusTaskOrder';

type UseHoyPlanTaskActionsOptions = {
  priorityTasks: Task[];
  waitingTasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onTasksReload?: () => void | Promise<void>;
  postponeSuccessMessage: string;
  promoteSuccessMessage: string;
  demoteSuccessMessage: string;
};

export function useHoyPlanTaskActions({
  priorityTasks,
  waitingTasks,
  setTasks,
  showToast,
  onTasksReload,
  postponeSuccessMessage,
  promoteSuccessMessage,
  demoteSuccessMessage,
}: UseHoyPlanTaskActionsOptions) {
  const today = getLocalDateString();
  const [priorityOrder, setPriorityOrder] = useState<string[]>([]);
  const [waitingOrder, setWaitingOrder] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    void loadHoyPlanOrder(`${today}:priority`).then((stored) => {
      if (active) setPriorityOrder(stored);
    });
    void loadHoyPlanOrder(`${today}:waiting`).then((stored) => {
      if (active) setWaitingOrder(stored);
    });
    return () => {
      active = false;
    };
  }, [today]);

  const incompletePriority = useMemo(
    () => priorityTasks.filter((task) => !task.is_completed),
    [priorityTasks],
  );
  const incompleteWaiting = useMemo(
    () => waitingTasks.filter((task) => !task.is_completed),
    [waitingTasks],
  );

  useEffect(() => {
    setPriorityOrder((prev) => {
      const next = ensureOrderForTasks(prev, priorityTasks);
      return next.join(',') === prev.join(',') ? prev : next;
    });
  }, [priorityTasks]);

  useEffect(() => {
    setWaitingOrder((prev) => {
      const next = ensureOrderForTasks(prev, waitingTasks);
      return next.join(',') === prev.join(',') ? prev : next;
    });
  }, [waitingTasks]);

  const orderedPriorityTasks = useMemo(() => {
    const normalized = ensureOrderForTasks(priorityOrder, priorityTasks);
    return applyHoyPlanOrder(priorityTasks, normalized);
  }, [priorityOrder, priorityTasks]);

  const orderedWaitingTasks = useMemo(() => {
    const normalized = ensureOrderForTasks(waitingOrder, waitingTasks);
    return applyHoyPlanOrder(waitingTasks, normalized);
  }, [waitingOrder, waitingTasks]);

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

      const nextOrder = priorityOrder.filter((id) => id !== taskId);
      setPriorityOrder(nextOrder);
      await saveHoyPlanOrder(`${today}:priority`, nextOrder);
      showToast(postponeSuccessMessage, 'success');
      void onTasksReload?.();
    },
    [onTasksReload, postponeSuccessMessage, priorityOrder, setTasks, showToast, today],
  );

  const handleMove = useCallback(
    async (taskId: string, direction: 'up' | 'down', bucket: 'priority' | 'waiting') => {
      const baseOrder = ensureOrderForTasks(
        bucket === 'priority' ? priorityOrder : waitingOrder,
        bucket === 'priority' ? priorityTasks : waitingTasks,
      );
      const nextOrder = swapInOrder(baseOrder, taskId, direction);
      if (!nextOrder) return;
      if (bucket === 'priority') {
        setPriorityOrder(nextOrder);
        await saveHoyPlanOrder(`${today}:priority`, nextOrder);
      } else {
        setWaitingOrder(nextOrder);
        await saveHoyPlanOrder(`${today}:waiting`, nextOrder);
      }
    },
    [priorityOrder, priorityTasks, today, waitingOrder, waitingTasks],
  );

  const handleDragMove = useCallback(
    (taskId: string, sourceColumnId: string, targetColumnId: string) => {
      if (sourceColumnId === targetColumnId) return;

      const promote = targetColumnId === HOY_PLAN_COLUMN_PRIORITY;
      const sourceOrder = sourceColumnId === HOY_PLAN_COLUMN_PRIORITY ? priorityOrder : waitingOrder;
      const targetOrder = targetColumnId === HOY_PLAN_COLUMN_PRIORITY ? priorityOrder : waitingOrder;
      const nextSource = sourceOrder.filter((id) => id !== taskId);
      const nextTarget = ensureOrderForTasks([...targetOrder, taskId], [
        ...(promote ? priorityTasks : waitingTasks),
        { id: taskId } as Task,
      ]);

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...task, is_priority: promote, scheduled_date: today }
            : task,
        ),
      );

      if (sourceColumnId === HOY_PLAN_COLUMN_PRIORITY) {
        setPriorityOrder(nextSource);
        setWaitingOrder(nextTarget);
      } else {
        setWaitingOrder(nextSource);
        setPriorityOrder(nextTarget);
      }

      showToast(promote ? promoteSuccessMessage : demoteSuccessMessage, 'success');

      void (async () => {
        const result = await setTaskPriorityFlag(taskId, promote);
        if (!result.ok) {
          setTasks((prev) =>
            prev.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    is_priority: !promote,
                    scheduled_date: task.scheduled_date ?? today,
                  }
                : task,
            ),
          );
          if (sourceColumnId === HOY_PLAN_COLUMN_PRIORITY) {
            setPriorityOrder(sourceOrder);
            setWaitingOrder(targetOrder);
          } else {
            setWaitingOrder(sourceOrder);
            setPriorityOrder(targetOrder);
          }
          showToast(result.error, 'error');
          return;
        }

        if (sourceColumnId === HOY_PLAN_COLUMN_PRIORITY) {
          await saveHoyPlanOrder(`${today}:priority`, nextSource);
          await saveHoyPlanOrder(`${today}:waiting`, nextTarget);
        } else {
          await saveHoyPlanOrder(`${today}:waiting`, nextSource);
          await saveHoyPlanOrder(`${today}:priority`, nextTarget);
        }
      })();
    },
    [
      demoteSuccessMessage,
      priorityOrder,
      priorityTasks,
      promoteSuccessMessage,
      setTasks,
      showToast,
      today,
      waitingOrder,
      waitingTasks,
    ],
  );

  return {
    orderedPriorityTasks,
    orderedWaitingTasks,
    handlePostpone,
    handleMove,
    handleDragMove,
  };
}
