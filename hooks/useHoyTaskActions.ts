import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Task } from '@/components/tasks/TaskCard';

type UseHoyDeleteTaskOptions = {
  t: (key: string, params?: Record<string, string | number>) => string;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  loadTasks: () => void | Promise<void>;
  setMenuOpen: (id: string | null) => void;
};

export function useHoyDeleteTask({
  t,
  showToast,
  setTasks,
  loadTasks,
  setMenuOpen,
}: UseHoyDeleteTaskOptions) {
  const handleDeleteTask = useCallback(
    (task: Task) => {
      Alert.alert(
        t('hoy.deleteTaskTitle'),
        `${t('hoy.deleteTaskConfirm', { task: task.content })}${
          task.subtasks && task.subtasks.length > 0
            ? `\n\n${t('hoy.deleteSubtasksAlso', { count: task.subtasks.length })}`
            : ''
        }`,
        [
          { text: t('errors.cancel'), style: 'cancel', onPress: () => setMenuOpen(null) },
          {
            text: t('errors.delete'),
            style: 'destructive',
            onPress: async () => {
              try {
                if (task.subtasks && task.subtasks.length > 0) {
                  const subtaskIds = task.subtasks.map((st: Task) => st.id);
                  const { error: subtasksError } = await supabase
                    .from('tasks')
                    .delete()
                    .in('id', subtaskIds);

                  if (subtasksError) {
                    logger.error('Error eliminando subtareas:', subtasksError);
                    showToast(t('errors.deleteSubtasksFailed'), 'error');
                    setMenuOpen(null);
                    return;
                  }
                }

                const { error } = await supabase.from('tasks').delete().eq('id', task.id);

                if (error) {
                  logger.error('Error eliminando tarea:', error);
                  showToast(t('errors.deleteTaskFailed'), 'error');
                  setMenuOpen(null);
                  return;
                }

                setTasks((prevTasks: Task[]) =>
                  prevTasks.filter((t: Task) => t.id !== task.id && t.parent_task_id !== task.id),
                );
                setMenuOpen(null);
                showToast(t('hoy.taskDeleted'), 'success');
                void loadTasks();
              } catch (error) {
                logger.error('Error inesperado al eliminar:', error);
                showToast(t('errors.deleteTaskFailed'), 'error');
                setMenuOpen(null);
              }
            },
          },
        ],
      );
    },
    [t, showToast, setTasks, loadTasks, setMenuOpen],
  );

  return { handleDeleteTask };
}

type UseHoyAllCompleteConfettiOptions = {
  tasks: Task[];
  loading: boolean;
  showConfetti: boolean;
  setShowConfetti: (value: boolean) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  t: (key: string) => string;
  confettiTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
};

export function useHoyAllCompleteConfetti({
  tasks,
  loading,
  showConfetti,
  setShowConfetti,
  showToast,
  t,
  confettiTimeoutRef,
}: UseHoyAllCompleteConfettiOptions) {
  const [previousCompletedCount, setPreviousCompletedCount] = useState(0);

  useEffect(() => {
    if (tasks.length === 0 || loading) return;

    const allCompleted = tasks.every((task: Task) => task.is_completed);
    const hasTasks = tasks.length > 0;
    const completedCount = tasks.filter((task: Task) => task.is_completed).length;
    const wasNotAllCompleted = previousCompletedCount < tasks.length;

    if (allCompleted && hasTasks && wasNotAllCompleted && !showConfetti) {
      setShowConfetti(true);
      showToast(t('hoy.dayComplete'), 'success');

      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
      confettiTimeoutRef.current = setTimeout(() => {
        setShowConfetti(false);
        confettiTimeoutRef.current = null;
      }, 4000);
    }

    setPreviousCompletedCount(completedCount);
  }, [tasks, loading, previousCompletedCount, showConfetti, setShowConfetti, showToast, t, confettiTimeoutRef]);
}
