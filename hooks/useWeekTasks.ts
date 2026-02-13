import { useState, useCallback, useRef } from 'react';
import { supabase, getErrorMessage } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Task } from '@/hooks/useTasks';

export interface Project {
  id: string;
  name: string;
  color: string;
}

export type WeekDay = {
  dateStr: string;
  label: string;
  dayName: string;
  isToday: boolean;
};

export type DayTasks = {
  day: WeekDay;
  tasks: Task[];
};

function getWeekBounds(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
}

function buildWeekDays(start: string): WeekDay[] {
  const today = new Date().toISOString().split('T')[0];
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const days: WeekDay[] = [];
  const d = new Date(start + 'T12:00:00');
  for (let i = 0; i < 7; i++) {
    const dateStr = d.toISOString().split('T')[0];
    const dayNum = d.getDate();
    days.push({
      dateStr,
      label: `${dayNames[i]} ${dayNum}`,
      dayName: dayNames[i],
      isToday: dateStr === today,
    });
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export function useWeekTasks(
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
) {
  const [weekTasks, setWeekTasks] = useState<DayTasks[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const isLoadingRef = useRef(false);

  const loadWeekTasks = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }

      const { start, end } = getWeekBounds();
      const weekDays = buildWeekDays(start);

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, color')
        .eq('user_id', user.id);

      if (projectsError) {
        logger.error('Error cargando proyectos:', projectsError);
      }
      setProjects(projectsData || []);

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_date', start)
        .lte('scheduled_date', end)
        .order('scheduled_date', { ascending: true })
        .order('is_priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (tasksError) {
        logger.error('Error cargando tareas de la semana:', tasksError);
        showToast(getErrorMessage(tasksError), 'error');
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }

      const tasks = (tasksData || []) as Task[];
      const parentTasks = tasks.filter((t) => !t.parent_task_id);
      const subtasks = tasks.filter((t) => t.parent_task_id);

      const tasksWithSubtasks = parentTasks.map((parent) => ({
        ...parent,
        subtasks: subtasks.filter((st) => st.parent_task_id === parent.id),
      }));

      const byDate = new Map<string, Task[]>();
      for (const day of weekDays) {
        byDate.set(day.dateStr, []);
      }
      for (const task of tasksWithSubtasks) {
        const dateStr = task.scheduled_date || start;
        if (byDate.has(dateStr)) {
          byDate.get(dateStr)!.push(task);
        }
      }

      const result: DayTasks[] = weekDays.map((day) => ({
        day,
        tasks: byDate.get(day.dateStr) || [],
      }));

      setWeekTasks(result);
    } catch (error) {
      logger.error('Error inesperado cargando semana:', error);
      showToast('Error al cargar la semana', 'error');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [showToast]);

  return {
    weekTasks,
    projects,
    loading,
    loadWeekTasks,
  };
}
