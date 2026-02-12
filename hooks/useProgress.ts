import { useMemo, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import type { Task } from '@/components/tasks/TaskCard';

export function useProgress(tasks: Task[], loading: boolean) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  const incompleteTasks = useMemo(() => {
    return tasks.filter((task) => !task.is_completed);
  }, [tasks]);

  const completedToday = useMemo(() => {
    return tasks.filter((task) => task.is_completed).length;
  }, [tasks]);

  const totalPriorityTasks = useMemo(() => {
    return tasks.filter((task) => task.is_priority && !task.is_completed).length;
  }, [tasks]);

  const progressPercentage = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((completedToday / tasks.length) * 100);
  }, [completedToday, tasks.length]);

  const progressWidth = useMemo(() => {
    if (tasks.length === 0) return 0;
    return (completedToday / tasks.length) * 100;
  }, [completedToday, tasks.length]);

  useEffect(() => {
    if (!loading && tasks.length > 0) {
      Animated.timing(progressAnim, {
        toValue: progressWidth,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [progressWidth, loading, tasks.length]);

  return {
    incompleteTasks,
    completedToday,
    totalPriorityTasks,
    progressPercentage,
    progressWidth,
  };
}
