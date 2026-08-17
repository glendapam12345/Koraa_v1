import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { removeTaskFromHoyPlanOrders } from '@/lib/hoyFocusTaskOrder';
import type { Task } from '@/components/tasks/TaskCard';

type UseHoyDeleteTaskOptions = {
  t: (key: string, params?: Record<string, string | number>) => string;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setMenuOpen: (id: string | null) => void;
  onDeleted?: () => void;
};

export function useHoyDeleteTask({
  t,
  showToast,
  setTasks,
  setMenuOpen,
  onDeleted,
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
                void removeTaskFromHoyPlanOrders(task.id);
                onDeleted?.();
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
    [t, showToast, setTasks, setMenuOpen, onDeleted],
  );

  return { handleDeleteTask };
}

type UseHoyAllCompleteConfettiOptions = {
  tasks: Task[];
  loading: boolean;
  showConfetti: boolean;
  setShowConfetti: (value: boolean) => void;
  confettiTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
};

export function useHoyAllCompleteConfetti({
  tasks,
  loading,
  showConfetti,
  setShowConfetti,
  confettiTimeoutRef,
}: UseHoyAllCompleteConfettiOptions) {
  const [previousCompletedCount, setPreviousCompletedCount] = useState(0);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    const completedCount = tasks.filter((task: Task) => task.is_completed).length;

    if (!hydratedRef.current) {
      hydratedRef.current = true;
      setPreviousCompletedCount(completedCount);
      return;
    }

    const allCompleted = tasks.length > 0 && tasks.every((task: Task) => task.is_completed);
    const justFinished = previousCompletedCount < tasks.length;

    if (allCompleted && justFinished && !showConfetti) {
      setShowConfetti(true);
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
      confettiTimeoutRef.current = setTimeout(() => {
        setShowConfetti(false);
        confettiTimeoutRef.current = null;
      }, 4000);
    }

    setPreviousCompletedCount(completedCount);
  }, [tasks, loading, previousCompletedCount, showConfetti, setShowConfetti, confettiTimeoutRef]);
}
