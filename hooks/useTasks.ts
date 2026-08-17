import { useState, useCallback, useRef } from 'react';
import { supabase, getErrorMessage, getCachedAuthUser } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalDateString, normalizeScheduledDate } from '@/lib/dateLocal';
import { loadTaskEffortMap } from '@/lib/taskPerceivedEffort';
import { TimeoutError, withTimeout } from '@/lib/withTimeout';
import { useI18n } from '@/contexts/I18nContext';

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
  life_area_key?: string | null;
  perceivedEffort?: 'light' | 'medium' | 'heavy';
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
    scheduled_date: normalizeScheduledDate(row.scheduled_date as string | null | undefined),
    life_area_key: (row.life_area_key as string | null | undefined) ?? null,
  };
}

export function buildOptimisticTask(args: {
  id: string;
  content: string;
  scheduledDate: string | null;
  projectId: string | null;
  isPriority?: boolean;
}): Task {
  return {
    id: args.id,
    content: args.content,
    is_completed: false,
    is_priority: args.isPriority ?? false,
    category: 'otros',
    completed_at: null,
    created_at: new Date().toISOString(),
    parent_task_id: null,
    project_id: args.projectId,
    scheduled_date: args.scheduledDate,
    subtasks: [],
  };
}

export function useTasks(
  todayMood: string | null,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
) {
  const { t } = useI18n();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const loadRequestIdRef = useRef(0);

  const loadTasks = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    const requestId = ++loadRequestIdRef.current;
    if (!silent) {
      setLoadingTasks(true);
    }

    try {
      const user = await withTimeout(getCachedAuthUser(), 12_000);
      if (requestId !== loadRequestIdRef.current) return;
      if (!user) {
        setLoadingTasks(false);
        return;
      }

      const { data: tasksData, error: tasksError } = await withTimeout(
        Promise.resolve(
          supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .is('parent_task_id', null)
            .order('is_priority', { ascending: false })
            .order('created_at', { ascending: true }),
        ),
        12_000,
      );

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
          if (requestId === loadRequestIdRef.current) {
            setLoadingTasks(false);
          }
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
        if (requestId === loadRequestIdRef.current) {
          setLoadingTasks(false);
        }
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

      const effortMap = await loadTaskEffortMap();
      const withEffort = tasksWithSubtasks.map((task) => ({
        ...task,
        perceivedEffort: effortMap[task.id],
        subtasks: task.subtasks?.map((sub) => ({
          ...sub,
          perceivedEffort: effortMap[sub.id],
        })),
      }));

      if (requestId !== loadRequestIdRef.current) return;

      setTasks(withEffort);

      if (todayMood && tasksWithSubtasks.length > 0) {
        const today = getLocalDateString();
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

      if (requestId === loadRequestIdRef.current) {
        setLoadingTasks(false);
      }
    } catch (error) {
      if (error instanceof TimeoutError) {
        logger.warn('Tasks load timeout');
        showToast(t('errors.refreshFailed'), 'error');
      } else {
        logger.error('Error inesperado cargando tareas:', error);
      }
      if (requestId === loadRequestIdRef.current) {
        setLoadingTasks(false);
      }
    }
  }, [todayMood, showToast, t]);

  return {
    tasks,
    loadingTasks,
    loadTasks,
    setTasks,
  };
}
