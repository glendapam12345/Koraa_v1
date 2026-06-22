import { useState, useCallback, useRef } from 'react';
import { supabase, getErrorMessage, isSchemaError, getSchemaSetupMessage, type SchemaSetupType } from '@/lib/supabase';
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

  const loadDateRange = useCallback(async (start: string, end: string) => {
    const requestId = ++loadRequestIdRef.current;
    setLoading(true);

    try {
      const rangeDays = buildDaysForRange(start, end, locale);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLastLoadError(null);
        setSchemaSetupType(null);
        const emptyResult: DayTasks[] = rangeDays.map((day) => ({ day, tasks: [] }));
        setWeekTasks(emptyResult);
        setProjects([]);
        setCheckInsByDate({});
        showToast(translate(locale, 'hooks.weekSignIn'), 'info');
        if (requestId === loadRequestIdRef.current) {
          setLoading(false);
        }
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

      const [tasksRes, checkInsRes] = await Promise.all([
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
        if (requestId === loadRequestIdRef.current) {
          setLoading(false);
        }
        return;
      }

      if (requestId !== loadRequestIdRef.current) return;

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
      }
    }
  }, [showToast, locale]);

  const loadWeekTasks = useCallback(
    async (weekStart?: string) => {
      const { start, end } = weekStart ? getWeekBoundsForStart(weekStart) : getWeekBounds();
      await loadDateRange(start, end);
    },
    [loadDateRange],
  );

  return {
    weekTasks,
    checkInsByDate,
    projects,
    loading,
    loadWeekTasks,
    loadDateRange,
    getWeekBounds,
    getWeekOptions,
    lastLoadError,
    schemaSetupType,
  };
}
