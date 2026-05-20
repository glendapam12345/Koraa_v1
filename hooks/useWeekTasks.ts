import { useState, useCallback, useRef } from 'react';
import { supabase, getErrorMessage, isSchemaError, getSchemaSetupMessage, type SchemaSetupType } from '@/lib/supabase';
import type { AppLocale } from '@/lib/i18n';
import { translate } from '@/lib/i18n';
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

/** Get week bounds for a Monday date string (YYYY-MM-DD) or offset in weeks from current. */
export function getWeekBoundsForStart(startDate: string): { start: string; end: string } {
  const monday = new Date(startDate + 'T12:00:00');
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
}

/** List of week start dates (Mondays) for previous 1 week + current + next N weeks. */
export function getWeekOptions(count: number): { start: string; label: string }[] {
  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const { start: thisStart } = getWeekBounds();
  const options: { start: string; label: string }[] = [];
  const d = new Date(thisStart + 'T12:00:00');
  d.setDate(d.getDate() - 7);
  options.push({ start: d.toISOString().split('T')[0], label: 'Semana ant.' });
  options.push({ start: thisStart, label: 'Esta semana' });
  d.setTime(new Date(thisStart + 'T12:00:00').getTime());
  for (let i = 1; i < count; i++) {
    d.setDate(d.getDate() + 7);
    const start = d.toISOString().split('T')[0];
    const dayNum = start.slice(8);
    const month = monthNames[parseInt(start.slice(5, 7), 10) - 1];
    options.push({ start, label: `${dayNum} ${month}` });
  }
  return options;
}

function buildWeekDays(start: string, locale: AppLocale): WeekDay[] {
  const today = new Date().toISOString().split('T')[0];
  const dayNames = [
    translate(locale, 'semana.weekdayMon'),
    translate(locale, 'semana.weekdayTue'),
    translate(locale, 'semana.weekdayWed'),
    translate(locale, 'semana.weekdayThu'),
    translate(locale, 'semana.weekdayFri'),
    translate(locale, 'semana.weekdaySat'),
    translate(locale, 'semana.weekdaySun'),
  ];
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
  showToast: (message: string, type: 'success' | 'error' | 'info') => void,
  locale: AppLocale = 'es',
) {
  const [weekTasks, setWeekTasks] = useState<DayTasks[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastLoadError, setLastLoadError] = useState<string | null>(null);
  const [schemaSetupType, setSchemaSetupType] = useState<SchemaSetupType | null>(null);
  const isLoadingRef = useRef(false);

  const loadWeekTasks = useCallback(async (weekStart?: string) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);

    try {
      const { start, end } = weekStart
        ? getWeekBoundsForStart(weekStart)
        : getWeekBounds();
      const weekDays = buildWeekDays(start, locale);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLastLoadError(null);
        setSchemaSetupType(null);
        const emptyResult: DayTasks[] = weekDays.map((day) => ({ day, tasks: [] }));
        setWeekTasks(emptyResult);
        setProjects([]);
        showToast(translate(locale, 'hooks.weekSignIn'), 'info');
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, color')
        .eq('user_id', user.id);

      if (projectsError) {
        if (isSchemaError(projectsError)) {
          setProjects([]);
        } else {
          logger.error('Error cargando proyectos:', projectsError);
          setProjects([]);
        }
      } else {
        setProjects(projectsData || []);
      }

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
        if (isSchemaError(tasksError)) {
          setSchemaSetupType(getSchemaSetupMessage(tasksError) || 'schema');
          setLastLoadError(null);
          const emptyResult: DayTasks[] = weekDays.map((day) => ({ day, tasks: [] }));
          setWeekTasks(emptyResult);
          showToast(translate(locale, 'hooks.weekSchema'), 'info');
        } else {
          logger.error('Error cargando tareas de la semana:', tasksError);
          setSchemaSetupType(null);
          setLastLoadError(getErrorMessage(tasksError, locale));
          const emptyResult: DayTasks[] = weekDays.map((day) => ({ day, tasks: [] }));
          setWeekTasks(emptyResult);
          showToast(translate(locale, 'hooks.weekLoadError'), 'error');
        }
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }

      setLastLoadError(null);
      setSchemaSetupType(null);

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
      if (isSchemaError(error)) {
        setSchemaSetupType(getSchemaSetupMessage(error) || 'schema');
        setLastLoadError(null);
        showToast('Para ver tareas por semana, actualiza la base de datos (ver instrucciones abajo).', 'info');
      } else {
        setSchemaSetupType(null);
        setLastLoadError(getErrorMessage(error, locale));
        showToast(translate(locale, 'hooks.weekGenericError'), 'error');
      }
      const { start } = getWeekBounds();
      const fallbackDays = buildWeekDays(start, locale);
      setWeekTasks(fallbackDays.map((day) => ({ day, tasks: [] })));
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [showToast, locale]);

  return {
    weekTasks,
    projects,
    loading,
    loadWeekTasks,
    getWeekBounds,
    getWeekOptions,
    lastLoadError,
    schemaSetupType,
  };
}
