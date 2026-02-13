import { useMemo } from 'react';
import { Task } from './useTasks';

export function useProgress(tasks: Task[], loading: boolean) {
  const incompleteTasks = useMemo(() => {
    return tasks.filter((t: Task) => !t.is_completed);
  }, [tasks]);

  const completedToday = useMemo(() => {
    return tasks.filter((t: Task) => t.is_completed).length;
  }, [tasks]);

  const totalPriorityTasks = useMemo(() => {
    return tasks.filter((t: Task) => t.is_priority).length;
  }, [tasks]);

  const progressPercentage = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((completedToday / tasks.length) * 100);
  }, [completedToday, tasks.length]);

  const progressWidth = useMemo(() => {
    return `${progressPercentage}%`;
  }, [progressPercentage]);

  return {
    incompleteTasks,
    completedToday,
    totalPriorityTasks,
    progressPercentage,
    progressWidth,
  };
}
