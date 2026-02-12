import { useMemo, useEffect } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import type { Task } from '@/components/tasks/TaskCard';

interface UseProgressReturn {
  incompleteTasks: Task[];
  completedToday: number;
  totalPriorityTasks: number;
  progressPercentage: number;
  progressWidth: ReturnType<typeof useSharedValue<number>>;
}

export function useProgress(tasks: Task[], loading: boolean): UseProgressReturn {
  const progressWidth = useSharedValue(0);

  const incompleteTasks = useMemo(
    () => tasks.filter((t: Task) => !t.is_completed),
    [tasks]
  );

  const completedToday = useMemo(
    () => tasks.filter((t: Task) => t.is_completed).length,
    [tasks]
  );

  const totalPriorityTasks = useMemo(
    () => incompleteTasks.length + completedToday,
    [incompleteTasks.length, completedToday]
  );

  const progressPercentage = useMemo(
    () => totalPriorityTasks > 0 ? (completedToday / totalPriorityTasks) * 100 : 0,
    [completedToday, totalPriorityTasks]
  );

  // Animar barra de progreso cuando cambia el porcentaje
  useEffect(() => {
    if (!loading && totalPriorityTasks > 0) {
      progressWidth.value = withTiming(progressPercentage, {
        duration: 500,
      });
    }
  }, [tasks, loading, totalPriorityTasks, progressPercentage, progressWidth]);

  return {
    incompleteTasks,
    completedToday,
    totalPriorityTasks,
    progressPercentage,
    progressWidth,
  };
}
