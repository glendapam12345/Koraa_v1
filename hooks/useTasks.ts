import { useState, useCallback, useRef } from 'react';
import { supabase, getErrorMessage } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Task {
  id: string;
  content: string;
  is_completed: boolean;
  is_priority: boolean;
  category: string;
  completed_at: string | null;
  created_at: string;
  subtasks?: Task[];
  parent_task_id: string | null;
  project_id?: string | null;
}

export function useTasks(
  todayMood: string | null,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const isLoadingRef = useRef(false);

  const loadTasks = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingTasks(false);
        isLoadingRef.current = false;
        return;
      }

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .is('parent_task_id', null)
        .order('is_priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (tasksError) {
        logger.error('Error cargando tareas:', tasksError);
        const errorMessage = getErrorMessage(tasksError);
        showToast(errorMessage, 'error');
        setLoadingTasks(false);
        isLoadingRef.current = false;
        return;
      }

      const { data: subtasksData, error: subtasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .not('parent_task_id', 'is', null)
        .order('created_at', { ascending: true });

      if (subtasksError) {
        logger.error('Error cargando subtareas:', subtasksError);
      }

      const tasksWithSubtasks = tasksData?.map((task: Task) => ({
        ...task,
        subtasks: subtasksData?.filter((st: Task) => st.parent_task_id === task.id) || [],
      })) || [];

      setTasks(tasksWithSubtasks);

      if (todayMood && tasksWithSubtasks.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `prioritization_${user.id}_${today}`;
        const stored = await AsyncStorage.getItem(storageKey);

        if (!stored) {
          const metadata = {
            date: today,
            totalTasksBefore: tasksWithSubtasks.length,
            mood: todayMood,
          };
          await AsyncStorage.setItem(storageKey, JSON.stringify(metadata));
        }
      }

      setLoadingTasks(false);
      isLoadingRef.current = false;
    } catch (error) {
      logger.error('Error inesperado cargando tareas:', error);
      setLoadingTasks(false);
      isLoadingRef.current = false;
    }
  }, [todayMood, showToast]);

  return {
    tasks,
    loadingTasks,
    loadTasks,
    setTasks,
  };
}
