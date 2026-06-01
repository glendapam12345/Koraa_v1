import { Platform } from 'react-native';
import { useCallback, MutableRefObject, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { supabase, getErrorMessage } from '@/lib/supabase';
import type { AppLocale } from '@/lib/i18n';
import { translate } from '@/lib/i18n';
import { logger } from '@/lib/logger';
import { Task } from './useTasks';
import { countPriorityCompletedBefore } from '@/lib/priorityProgress';
import { getLocalDateString } from '@/lib/dateLocal';

export type TaskCompletedPayload = {
  task: Task;
  isSubtask: boolean;
  isFirstPriorityToday: boolean;
  allPrioritiesDoneToday: boolean;
};

interface UseTaskActionsParams {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  loadTasks: () => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  setMenuOpen: (id: string | null) => void;
  backgroundLoadTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  isLoadingTasksRef: MutableRefObject<boolean>;
  locale?: AppLocale;
  onTaskCompleted?: (payload: TaskCompletedPayload) => void;
}

export function useTaskActions({
  tasks,
  setTasks,
  loadTasks,
  showToast,
  setMenuOpen,
  backgroundLoadTimeoutRef,
  isLoadingTasksRef,
  locale = 'es',
  onTaskCompleted,
}: UseTaskActionsParams) {
  const toggleTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const toggleTask = useCallback(
    async (taskId: string, isSubtask: boolean = false, parentTaskId?: string) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const task = isSubtask
        ? tasks
            .find((t: Task) => t.id === parentTaskId)
            ?.subtasks?.find((st: Task) => st.id === taskId)
        : tasks.find((t: Task) => t.id === taskId);

      if (!task) return;

      const newCompletedState = !task.is_completed;
      const today = getLocalDateString();
      const isCompletingMainPriority =
        !isSubtask && task.is_priority && !task.is_completed && newCompletedState;
      const priorPriorityDone = isCompletingMainPriority
        ? countPriorityCompletedBefore(tasks, task.id, today)
        : 0;
      const pendingPriorityBefore = isCompletingMainPriority
        ? tasks.filter((t) => t.is_priority && !t.parent_task_id && !t.is_completed).length
        : 0;

      setTasks((prevTasks: Task[]) => {
        if (isSubtask && parentTaskId) {
          return prevTasks.map((t: Task) => {
            if (t.id === parentTaskId) {
              return {
                ...t,
                subtasks:
                  t.subtasks?.map((st: Task) =>
                    st.id === taskId
                      ? {
                          ...st,
                          is_completed: newCompletedState,
                          completed_at: newCompletedState
                            ? new Date().toISOString()
                            : null,
                        }
                      : st
                  ) || [],
              };
            }
            return t;
          });
        }

        return prevTasks.map((t: Task) =>
          t.id === taskId
            ? {
                ...t,
                is_completed: newCompletedState,
                completed_at: newCompletedState ? new Date().toISOString() : null,
              }
            : t
        );
      });

      setMenuOpen(null);

      if (toggleTimeoutsRef.current[taskId]) {
        clearTimeout(toggleTimeoutsRef.current[taskId]);
      }

      toggleTimeoutsRef.current[taskId] = setTimeout(async () => {
        try {
          const { error } = await supabase
            .from('tasks')
            .update({
              is_completed: newCompletedState,
              completed_at: newCompletedState ? new Date().toISOString() : null,
            })
            .eq('id', taskId);

          if (error) {
            logger.error('Error actualizando tarea:', error);
            const errorMessage = getErrorMessage(error, locale);
            showToast(errorMessage, 'error');

            setTasks((prevTasks: Task[]) => {
              if (isSubtask && parentTaskId) {
                return prevTasks.map((t: Task) => {
                  if (t.id === parentTaskId) {
                    return {
                      ...t,
                      subtasks:
                        t.subtasks?.map((st: Task) =>
                          st.id === taskId
                            ? {
                                ...st,
                                is_completed: !newCompletedState,
                                completed_at: null,
                              }
                            : st
                        ) || [],
                    };
                  }
                  return t;
                });
              }

              return prevTasks.map((t: Task) =>
                t.id === taskId
                  ? {
                      ...t,
                      is_completed: !newCompletedState,
                      completed_at: null,
                    }
                  : t
              );
            });
          } else {
            if (newCompletedState) {
              const notifyPriorityComplete = isCompletingMainPriority && onTaskCompleted;
              if (Platform.OS !== 'web' && !notifyPriorityComplete) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }

              if (notifyPriorityComplete) {
                const doneAfter = priorPriorityDone + 1;
                onTaskCompleted({
                  task,
                  isSubtask: false,
                  isFirstPriorityToday: priorPriorityDone === 0,
                  allPrioritiesDoneToday: pendingPriorityBefore <= 1,
                });
              }
            }

            // Si era un paso (subtask) y lo acabamos de completar, ver si todos los pasos están hechos → completar tarea padre
            if (isSubtask && parentTaskId && newCompletedState) {
              const { data: siblingSubtasks } = await supabase
                .from('tasks')
                .select('id, is_completed')
                .eq('parent_task_id', parentTaskId);
              const allStepsComplete =
                siblingSubtasks &&
                siblingSubtasks.length > 0 &&
                siblingSubtasks.every((s: { is_completed: boolean }) => s.is_completed);
              if (allStepsComplete) {
                const completedAt = new Date().toISOString();
                const { error: parentError } = await supabase
                  .from('tasks')
                  .update({ is_completed: true, completed_at: completedAt })
                  .eq('id', parentTaskId);
                if (!parentError) {
                  setTasks((prev: Task[]) =>
                    prev.map((t: Task) =>
                      t.id === parentTaskId
                        ? { ...t, is_completed: true, completed_at: completedAt }
                        : t
                    )
                  );
                  showToast(translate(locale, 'hooks.allStepsDone'), 'success');
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                }
              }
            }

            if (backgroundLoadTimeoutRef.current) {
              clearTimeout(backgroundLoadTimeoutRef.current);
            }

            // Refrescar lista tras un retraso para dar tiempo al backend a persistir y evitar que la tarea reaparezca como pendiente
            backgroundLoadTimeoutRef.current = setTimeout(() => {
              if (!isLoadingTasksRef.current) {
                loadTasks();
              }
              backgroundLoadTimeoutRef.current = null;
            }, 2000);
          }
        } catch (error) {
          logger.error('Error inesperado al actualizar:', error);
          const errorMessage = getErrorMessage(error, locale);
          showToast(errorMessage, 'error');

          setTasks((prevTasks: Task[]) => {
            if (isSubtask && parentTaskId) {
              return prevTasks.map((t: Task) => {
                if (t.id === parentTaskId) {
                  return {
                    ...t,
                    subtasks:
                      t.subtasks?.map((st: Task) =>
                        st.id === taskId
                          ? {
                              ...st,
                              is_completed: !newCompletedState,
                              completed_at: null,
                            }
                          : st
                      ) || [],
                  };
                }
                return t;
              });
            }

            return prevTasks.map((t: Task) =>
              t.id === taskId
                ? {
                    ...t,
                    is_completed: !newCompletedState,
                    completed_at: null,
                  }
                : t
            );
          });
        }

        delete toggleTimeoutsRef.current[taskId];
      }, 500);
    },
    [
      tasks,
      setTasks,
      loadTasks,
      showToast,
      setMenuOpen,
      backgroundLoadTimeoutRef,
      isLoadingTasksRef,
      locale,
      onTaskCompleted,
    ]
  );

  const clearToggleTimers = useCallback(() => {
    Object.values(toggleTimeoutsRef.current).forEach((timer) => clearTimeout(timer));
    toggleTimeoutsRef.current = {};
  }, []);

  const handleSaveEdit = useCallback(
    async (
      editingTask: Task | null,
      editContent: string,
      setEditingTask: (task: Task | null) => void,
      setEditContent: (content: string) => void
    ) => {
      if (!editingTask || !editContent.trim()) return;

      try {
        const { error } = await supabase
          .from('tasks')
          .update({ content: editContent.trim() })
          .eq('id', editingTask.id);

        if (error) {
          logger.error('Error actualizando tarea:', error);
          const errorMessage = getErrorMessage(error, locale);
          showToast(errorMessage, 'error');
          return;
        }

        setTasks((prevTasks: Task[]) =>
          prevTasks.map((t: Task) =>
            t.id === editingTask.id ? { ...t, content: editContent.trim() } : t
          )
        );

        setEditingTask(null);
        setEditContent('');
        showToast(translate(locale, 'hooks.taskUpdated'), 'success');

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        logger.error('Error inesperado al editar:', error);
        const errorMessage = getErrorMessage(error, locale);
        showToast(errorMessage, 'error');
      }
    },
    [setTasks, showToast, locale]
  );

  return {
    toggleTask,
    handleSaveEdit,
    clearToggleTimers,
  };
}
