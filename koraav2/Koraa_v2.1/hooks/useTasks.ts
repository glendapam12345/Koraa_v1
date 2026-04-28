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
  scheduled_date?: string | null;
}

function isMissingColumnError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === '42703' ||
    (typeof error.message === 'string' && error.message.includes('does not exist'))
  );
}

/** Normaliza fila de Supabase al tipo Task (columnas opcionales según migraciones). */
function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: String(row.id),
    content: String(row.content ?? ''),
    is_completed: Boolean(row.is_completed),
    is_priority: Boolean(row.is_priority),
    category: String(row.category ?? ''),
    completed_at: (row.completed_at as string | null) ?? null,
    created_at: String(row.created_at ?? ''),
    parent_task_id: (row.parent_task_id as string | null | undefined) ?? null,
    project_id: (row.project_id as string | null | undefined) ?? null,
    scheduled_date: (row.scheduled_date as string | null | undefined) ?? null,
  };
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

      let tasksWithSubtasks: Task[] = [];

      if (tasksError && isMissingColumnError(tasksError)) {
        logger.warn(
          'tasks.parent_task_id no existe en la BD. Cargando tareas sin subtareas. Ejecuta supabase/migrations/20260321150000_ensure_tasks_parent_task_id.sql en Supabase.',
        );
        const { data: allRows, error: allErr } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('is_priority', { ascending: false })
          .order('created_at', { ascending: true });

        if (allErr) {
          logger.error('Error cargando tareas:', allErr);
          showToast(getErrorMessage(allErr), 'error');
          setLoadingTasks(false);
          isLoadingRef.current = false;
          return;
        }

        tasksWithSubtasks = (allRows ?? []).map((row) => ({
          ...rowToTask(row as Record<string, unknown>),
          subtasks: [],
        }));
      } else if (tasksError) {
        logger.error('Error cargando tareas:', tasksError);
        const errorMessage = getErrorMessage(tasksError);
        showToast(errorMessage, 'error');
        setLoadingTasks(false);
        isLoadingRef.current = false;
        return;
      } else {
        const { data: subtasksData, error: subtasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .not('parent_task_id', 'is', null)
          .order('created_at', { ascending: true });

        if (subtasksError && !isMissingColumnError(subtasksError)) {
          logger.error('Error cargando subtareas:', subtasksError);
        }

        const subs = isMissingColumnError(subtasksError) ? [] : subtasksData ?? [];

        tasksWithSubtasks =
          tasksData?.map((task: Record<string, unknown>) => {
            const t = rowToTask(task);
            return {
              ...t,
              subtasks:
                subs
                  .filter((st: Record<string, unknown>) => st.parent_task_id === t.id)
                  .map((st) => rowToTask(st)) || [],
            };
          }) ?? [];
      }

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
