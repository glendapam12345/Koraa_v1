import { useState, useCallback, useRef } from 'react';
import { supabase, getErrorMessage, isSchemaError, getSchemaSetupMessage, getCachedAuthUser, type SchemaSetupType } from '@/lib/supabase';
import { getLocalDateString, normalizeScheduledDate, parseLocalDateString } from '@/lib/dateLocal';
import { translate, type AppLocale } from '@/lib/i18n';
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

export type WeekDayCheckIn = {
  emotion: string;
  energy_level: number;
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
    start: getLocalDateString(monday),
    end: getLocalDateString(sunday),
  };
}

/** Get week bounds for a Monday date string (YYYY-MM-DD) or offset in weeks from current. */
export function getWeekBoundsForStart(startDate: string): { start: string; end: string } {
  const monday = parseLocalDateString(startDate);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: getLocalDateString(monday),
    end: getLocalDateString(sunday),
  };
}

/** List of week start dates (Mondays) for previous 1 week + current + next N weeks. */
export function getWeekOptions(count: number): { start: string; label: string }[] {
  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const { start: thisStart } = getWeekBounds();
  const options: { start: string; label: string }[] = [];
  const d = parseLocalDateString(thisStart);
  d.setDate(d.getDate() - 7);
  options.push({ start: getLocalDateString(d), label: 'Semana ant.' });
  options.push({ start: thisStart, label: 'Esta semana' });
  d.setTime(parseLocalDateString(thisStart).getTime());
  for (let i = 1; i < count; i++) {
    d.setDate(d.getDate() + 7);
    const start = getLocalDateString(d);
    const dayNum = start.slice(8);
    const month = monthNames[parseInt(start.slice(5, 7), 10) - 1];
    options.push({ start, label: `${dayNum} ${month}` });
  }
  return options;
}

function buildDaysForRange(start: string, end: string, locale: AppLocale): WeekDay[] {
  const today = getLocalDateString();
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
  const cursor = parseLocalDateString(start);
  const endDate = parseLocalDateString(end);

  while (cursor <= endDate) {
    const dateStr = getLocalDateString(cursor);
    const dayIndex = (cursor.getDay() + 6) % 7;
    days.push({
      dateStr,
      label: `${dayNames[dayIndex]} ${cursor.getDate()}`,
      dayName: dayNames[dayIndex],
      isToday: dateStr === today,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function buildWeekDays(start: string, locale: AppLocale): WeekDay[] {
  const { end } = getWeekBoundsForStart(start);
  return buildDaysForRange(start, end, locale);
}

export function useWeekTasks(
  showToast: (message: string, type: 'success' | 'error' | 'info') => void,
  locale: AppLocale = 'es',
) {
  const [weekTasks, setWeekTasks] = useState<DayTasks[]>([]);
  const [checkInsByDate, setCheckInsByDate] = useState<Record<string, WeekDayCheckIn>>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastLoadError, setLastLoadError] = useState<string | null>(null);
  const [schemaSetupType, setSchemaSetupType] = useState<SchemaSetupType | null>(null);
  const loadRequestIdRef = useRef(0);
  const isLoadingRef = useRef(false);

  const loadDateRange = useCallback(async (
    start: string,
    end: string,
    options?: { silent?: boolean },
  ) => {
    if (isLoadingRef.current && options?.silent) return;
    const requestId = ++loadRequestIdRef.current;
    isLoadingRef.current = true;
    if (!options?.silent) {
      setLoading(true);
    }

    try {
      const rangeDays = buildDaysForRange(start, end, locale);

      const user = await getCachedAuthUser();
      if (requestId !== loadRequestIdRef.current) return;

      if (!user) {
        setLastLoadError(null);
        setSchemaSetupType(null);
        const emptyResult: DayTasks[] = rangeDays.map((day) => ({ day, tasks: [] }));
        setWeekTasks(emptyResult);
        setProjects([]);
        setCheckInsByDate({});
        showToast(translate(locale, 'hooks.weekSignIn'), 'info');
        return;
      }

      const [projectsRes, tasksRes, checkInsRes] = await Promise.all([
        supabase
          .from('projects')
          .select('id, name, color')
          .eq('user_id', user.id),
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .gte('scheduled_date', start)
          .lte('scheduled_date', end)
          .order('scheduled_date', { ascending: true })
          .order('is_priority', { ascending: false })
          .order('created_at', { ascending: true }),
        supabase
          .from('daily_check_ins')
          .select('date, emotion, energy_level')
          .eq('user_id', user.id)
          .gte('date', start)
          .lte('date', end),
      ]);

      if (requestId !== loadRequestIdRef.current) return;

      const projectsError = projectsRes.error;
      const projectsData = projectsRes.data;

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

      const tasksError = tasksRes.error;
      const tasksData = tasksRes.data;

      if (checkInsRes.error && !isSchemaError(checkInsRes.error)) {
        logger.error('Error cargando check-ins de la semana:', checkInsRes.error);
      }

      const weekCheckIns: Record<string, WeekDayCheckIn> = {};
      for (const row of checkInsRes.data ?? []) {
        if (row.date && row.emotion) {
          weekCheckIns[row.date] = {
            emotion: row.emotion,
            energy_level: row.energy_level ?? 0,
          };
        }
      }
      setCheckInsByDate(weekCheckIns);

      if (tasksError) {
        if (isSchemaError(tasksError)) {
          setSchemaSetupType(getSchemaSetupMessage(tasksError) || 'schema');
          setLastLoadError(null);
          const emptyResult: DayTasks[] = rangeDays.map((day) => ({ day, tasks: [] }));
          setWeekTasks(emptyResult);
          setCheckInsByDate({});
          showToast(translate(locale, 'hooks.weekSchema'), 'info');
        } else {
          logger.error('Error cargando tareas de la semana:', tasksError);
          setSchemaSetupType(null);
          setLastLoadError(getErrorMessage(tasksError, locale));
          const emptyResult: DayTasks[] = rangeDays.map((day) => ({ day, tasks: [] }));
          setWeekTasks(emptyResult);
          setCheckInsByDate({});
          showToast(translate(locale, 'hooks.weekLoadError'), 'error');
        }
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
      for (const day of rangeDays) {
        byDate.set(day.dateStr, []);
      }
      for (const task of tasksWithSubtasks) {
        const dateStr = normalizeScheduledDate(task.scheduled_date);
        if (dateStr && byDate.has(dateStr)) {
          byDate.get(dateStr)!.push({ ...task, scheduled_date: dateStr });
        }
      }

      const result: DayTasks[] = rangeDays.map((day) => ({
        day,
        tasks: byDate.get(day.dateStr) || [],
      }));

      setWeekTasks(result);
    } catch (error) {
      if (requestId !== loadRequestIdRef.current) return;
      logger.error('Error inesperado cargando semana:', error);
      if (isSchemaError(error)) {
        setSchemaSetupType(getSchemaSetupMessage(error) || 'schema');
        setLastLoadError(null);
        showToast(translate(locale, 'hooks.weekSchema'), 'info');
      } else {
        setSchemaSetupType(null);
        setLastLoadError(getErrorMessage(error, locale));
        showToast(translate(locale, 'hooks.weekGenericError'), 'error');
      }
      const { start } = getWeekBounds();
      const fallbackDays = buildWeekDays(start, locale);
      setWeekTasks(fallbackDays.map((day) => ({ day, tasks: [] })));
      setCheckInsByDate({});
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [showToast, locale]);

  const loadWeekTasks = useCallback(
    async (weekStart?: string, options?: { silent?: boolean }) => {
      const { start, end } = weekStart ? getWeekBoundsForStart(weekStart) : getWeekBounds();
      await loadDateRange(start, end, options);
    },
    [loadDateRange],
  );

  const patchTaskCompleted = useCallback((taskId: string, isCompleted: boolean) => {
    setWeekTasks((prev) =>
      prev.map((day) => ({
        ...day,
        tasks: day.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                is_completed: isCompleted,
                completed_at: isCompleted ? new Date().toISOString() : null,
              }
            : task,
        ),
      })),
    );
  }, []);

  const appendTaskToDay = useCallback((dateStr: string, task: Task) => {
    loadRequestIdRef.current += 1;
    isLoadingRef.current = false;
    setLoading(false);
    setWeekTasks((prev) => {
      if (prev.length === 0) return prev;
      let found = false;
      const next = prev.map((day) => {
        if (day.day.dateStr !== dateStr) return day;
        found = true;
        if (day.tasks.some((existing) => existing.id === task.id)) return day;
        return { ...day, tasks: [...day.tasks, task] };
      });
      return found ? next : prev;
    });
  }, []);

  return {
    weekTasks,
    checkInsByDate,
    projects,
    loading,
    loadWeekTasks,
    loadDateRange,
    appendTaskToDay,
    patchTaskCompleted,
    getWeekBounds,
    getWeekOptions,
    lastLoadError,
    schemaSetupType,
  };
}
