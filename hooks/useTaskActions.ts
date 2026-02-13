import { Platform } from 'react-native';
import { useCallback, MutableRefObject } from 'react';
import * as Haptics from 'expo-haptics';
import { supabase, getErrorMessage } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { Task } from './useTasks';

interface UseTaskActionsParams {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  loadTasks: () => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  setMenuOpen: (id: string | null) => void;
  timeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  backgroundLoadTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  isLoadingTasksRef: MutableRefObject<boolean>;
}

export function useTaskActions({
  tasks,
  setTasks,
  loadTasks,
  showToast,
  setMenuOpen,
  timeoutRef,
  backgroundLoadTimeoutRef,
  isLoadingTasksRef,
}: UseTaskActionsParams) {
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

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
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
            const errorMessage = getErrorMessage(error);
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
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }

            if (backgroundLoadTimeoutRef.current) {
              clearTimeout(backgroundLoadTimeoutRef.current);
            }

            backgroundLoadTimeoutRef.current = setTimeout(() => {
              if (!isLoadingTasksRef.current) {
                loadTasks();
              }
              backgroundLoadTimeoutRef.current = null;
            }, 1000);
          }
        } catch (error) {
          logger.error('Error inesperado al actualizar:', error);
          const errorMessage = getErrorMessage(error);
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

        timeoutRef.current = null;
      }, 500);
    },
    [
      tasks,
      setTasks,
      loadTasks,
      showToast,
      setMenuOpen,
      timeoutRef,
      backgroundLoadTimeoutRef,
      isLoadingTasksRef,
    ]
  );

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
          const errorMessage = getErrorMessage(error);
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
        showToast('Tarea actualizada', 'success');

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        logger.error('Error inesperado al editar:', error);
        const errorMessage = getErrorMessage(error);
        showToast(errorMessage, 'error');
      }
    },
    [setTasks, showToast]
  );

  return {
    toggleTask,
    handleSaveEdit,
  };
}
