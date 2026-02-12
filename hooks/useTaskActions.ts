import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase, getErrorMessage } from '@/lib/supabase';
import { detectCategory } from '@/lib/categoryDetection';
import type { Task } from '@/components/tasks/TaskCard';

interface UseTaskActionsProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  loadTasks: () => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  setMenuOpen: (taskId: string | null) => void;
  timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  backgroundLoadTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  isLoadingTasksRef: React.MutableRefObject<boolean>;
}

interface UseTaskActionsReturn {
  toggleTask: (taskId: string, isSubtask: boolean, parentTaskId?: string) => Promise<void>;
  handleSaveEdit: (
    editingTask: Task | null,
    editContent: string,
    setEditingTask: (task: Task | null) => void,
    setEditContent: (content: string) => void
  ) => Promise<void>;
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
}: UseTaskActionsProps): UseTaskActionsReturn {
  const toggleTask = useCallback(async (
    taskId: string,
    isSubtask: boolean = false,
    parentTaskId?: string
  ) => {
    const task = isSubtask
      ? tasks.find((t: Task) => t.id === parentTaskId)?.subtasks?.find((st: Task) => st.id === taskId)
      : tasks.find((t: Task) => t.id === taskId);

    if (!task) return;

    const newCompletedState = !task.is_completed;

    // Haptic feedback al completar tarea
    if (Platform.OS !== 'web' && newCompletedState) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          is_completed: newCompletedState,
          completed_at: newCompletedState ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error actualizando tarea:', error);
        const errorMessage = getErrorMessage(error);
        showToast(errorMessage, 'error');
        // Revertir cambio optimista
        setTasks(tasks.map((t: Task) =>
          t.id === taskId ? { ...t, is_completed: !newCompletedState } : t
        ));
        return;
      }

      // Si se completa una tarea principal, animar fade out después de un delay
      if (newCompletedState && !isSubtask) {
        setTimeout(() => {
          setTasks((prev: Task[]) => prev.filter((t: Task) => t.id !== taskId));
        }, 600);
      }

      // Actualizar estado local y verificar si la tarea principal debe completarse
      if (isSubtask && parentTaskId) {
        const updatedTasks = tasks.map((t: Task) => {
          if (t.id === parentTaskId && t.subtasks) {
            const updatedSubtasks = t.subtasks.map((st: Task) =>
              st.id === taskId ? { ...st, is_completed: newCompletedState } : st
            );
            
            const allSubtasksCompleted = updatedSubtasks.every((st: Task) => st.is_completed);
            const wasParentCompleted = t.is_completed;
            
            if (allSubtasksCompleted && !wasParentCompleted) {
              (async () => {
                try {
                  const { error: updateError } = await supabase
                    .from('tasks')
                    .update({
                      is_completed: true,
                      completed_at: new Date().toISOString(),
                    })
                    .eq('id', parentTaskId);

                  if (updateError) {
                    throw updateError;
                  }

                  if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                  }
                  timeoutRef.current = setTimeout(() => {
                    loadTasks().catch(() => {});
                    timeoutRef.current = null;
                  }, 200);
                } catch (error) {
                  console.error('Error actualizando tarea principal:', error);
                  setTasks((prevTasks: Task[]) => prevTasks.map((t: Task) => {
                    if (t.id === parentTaskId && t.subtasks) {
                      const revertedSubtasks = t.subtasks.map((st: Task) =>
                        st.id === taskId ? { ...st, is_completed: !newCompletedState } : st
                      );
                      return {
                        ...t,
                        subtasks: revertedSubtasks,
                        is_completed: !allSubtasksCompleted,
                      };
                    }
                    return t;
                  }));
                  const errorMessage = getErrorMessage(error);
                  showToast(`Error: ${errorMessage}`, 'error');
                }
              })();
            } else if (!allSubtasksCompleted && wasParentCompleted) {
              (async () => {
                try {
                  const { error: updateError } = await supabase
                    .from('tasks')
                    .update({
                      is_completed: false,
                      completed_at: null,
                    })
                    .eq('id', parentTaskId);

                  if (updateError) {
                    throw updateError;
                  }

                  if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                  }
                  timeoutRef.current = setTimeout(() => {
                    loadTasks().catch(() => {});
                    timeoutRef.current = null;
                  }, 200);
                } catch (error) {
                  console.error('Error actualizando tarea principal:', error);
                  setTasks((prevTasks: Task[]) => prevTasks.map((t: Task) => {
                    if (t.id === parentTaskId && t.subtasks) {
                      const revertedSubtasks = t.subtasks.map((st: Task) =>
                        st.id === taskId ? { ...st, is_completed: !newCompletedState } : st
                      );
                      return {
                        ...t,
                        subtasks: revertedSubtasks,
                        is_completed: allSubtasksCompleted,
                      };
                    }
                    return t;
                  }));
                  const errorMessage = getErrorMessage(error);
                  showToast(`Error: ${errorMessage}`, 'error');
                }
              })();
            }
            
            return {
              ...t,
              subtasks: updatedSubtasks,
              is_completed: allSubtasksCompleted,
            };
          }
          return t;
        });
        
        setTasks(updatedTasks);
      } else {
        setTasks(tasks.map((t: Task) =>
          t.id === taskId ? { ...t, is_completed: newCompletedState } : t
        ));
      }
      
      setMenuOpen(null);
      
      if (!isSubtask || !parentTaskId) {
        setTimeout(() => {
          loadTasks().catch(() => {});
        }, 500);
      }
      
      if (newCompletedState) {
        const completedCount = tasks.filter((t: Task) => t.is_completed).length + 1;
        const totalCount = tasks.length;
        const progressPercentage = Math.round((completedCount / totalCount) * 100);
        
        let message = '¡Tarea completada!';
        if (progressPercentage >= 50 && progressPercentage < 100) {
          message = `¡Vas bien! ${progressPercentage}% completado ✨`;
        } else if (progressPercentage === 100) {
          message = '¡Día completo! Descansa y disfruta 🌟';
        }
        
        showToast(message, 'success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        showToast('Tarea marcada como pendiente', 'info');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      showToast('Ocurrió un error al actualizar la tarea', 'error');
      setMenuOpen(null);
    }
  }, [tasks, setTasks, loadTasks, showToast, setMenuOpen, timeoutRef]);

  const handleSaveEdit = useCallback(async (
    editingTask: Task | null,
    editContent: string,
    setEditingTask: (task: Task | null) => void,
    setEditContent: (content: string) => void
  ) => {
    if (!editingTask || !editContent.trim()) return;

    try {
      const detectedCategory = detectCategory(editContent.trim());
      
      const { error } = await supabase
        .from('tasks')
        .update({
          content: editContent.trim(),
          category: detectedCategory || editingTask.category || '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTask.id);

      if (error) {
        console.error('Error actualizando tarea:', error);
        const errorMessage = getErrorMessage(error);
        showToast(errorMessage, 'error');
        return;
      }

      setTasks((prevTasks: Task[]) => prevTasks.map((t: Task) => {
        if (t.id === editingTask.id) {
          return {
            ...t,
            content: editContent.trim(),
            category: detectedCategory || editingTask.category || '',
          };
        }
        if (t.subtasks) {
          const updatedSubtasks = t.subtasks.map((st: Task) =>
            st.id === editingTask.id ? {
              ...st,
              content: editContent.trim(),
              category: detectedCategory || editingTask.category || '',
            } : st
          );
          return { ...t, subtasks: updatedSubtasks };
        }
        return t;
      }));

      if (backgroundLoadTimeoutRef.current) {
        clearTimeout(backgroundLoadTimeoutRef.current);
      }
      backgroundLoadTimeoutRef.current = setTimeout(() => {
        if (!isLoadingTasksRef.current) {
          isLoadingTasksRef.current = true;
          loadTasks()
            .catch(() => {})
            .finally(() => {
              isLoadingTasksRef.current = false;
              backgroundLoadTimeoutRef.current = null;
            });
        }
      }, 300);

      setEditingTask(null);
      setEditContent('');
      showToast('Tarea actualizada correctamente', 'success');
    } catch (error) {
      console.error('Error inesperado:', error);
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage, 'error');
    }
  }, [setTasks, loadTasks, showToast, backgroundLoadTimeoutRef, isLoadingTasksRef]);

  return {
    toggleTask,
    handleSaveEdit,
  };
}
