import { useCallback, useRef, useState } from 'react';
import { supabase, getErrorMessage, isSchemaError, getCachedAuthUser } from '@/lib/supabase';
import { translate, type AppLocale } from '@/lib/i18n';
import { logger } from '@/lib/logger';
import { buildMonthGrid, getMonthBounds, type CalendarDayCell } from '@/lib/calendarGrid';
import type { Task } from '@/hooks/useTasks';
import { normalizeScheduledDate } from '@/lib/dateLocal';

export type CalendarDayData = CalendarDayCell & {
  emotion?: string;
  energyLevel?: number;
  taskCount: number;
  incompleteCount: number;
};

export type MonthCheckIn = {
  date: string;
  emotion: string;
  energy_level: number;
};

function emptyMonthDays(year: number, monthIndex: number): CalendarDayData[] {
  return buildMonthGrid(year, monthIndex).map((cell) => ({
    ...cell,
    taskCount: 0,
    incompleteCount: 0,
  }));
}

export function useMonthCalendar(
  year: number,
  monthIndex: number,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void,
  locale: AppLocale = 'es',
) {
  const [days, setDays] = useState<CalendarDayData[]>(() => emptyMonthDays(year, monthIndex));
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(false);
  const isLoadingRef = useRef(false);
  const loadRequestIdRef = useRef(0);

  const loadMonth = useCallback(async (options?: { silent?: boolean }) => {
    if (isLoadingRef.current && !options?.silent) return;
    const requestId = ++loadRequestIdRef.current;
    isLoadingRef.current = true;
    if (!options?.silent) {
      setLoading(true);
    }

    const grid = buildMonthGrid(year, monthIndex);
    const { start, end } = getMonthBounds(year, monthIndex);

    try {
      const user = await getCachedAuthUser();
      if (!user) {
        if (requestId !== loadRequestIdRef.current) return;
        setDays(emptyMonthDays(year, monthIndex));
        setTasksByDate({});
        showToast(translate(locale, 'hooks.weekSignIn'), 'info');
        return;
      }

      const [checkInsRes, tasksRes] = await Promise.all([
        supabase
          .from('daily_check_ins')
          .select('date, emotion, energy_level')
          .eq('user_id', user.id)
          .gte('date', start)
          .lte('date', end),
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .gte('scheduled_date', start)
          .lte('scheduled_date', end)
          .order('scheduled_date', { ascending: true }),
      ]);

      if (checkInsRes.error && !isSchemaError(checkInsRes.error)) {
        logger.error('Error cargando check-ins del mes:', checkInsRes.error);
      }
      if (tasksRes.error && !isSchemaError(tasksRes.error)) {
        logger.error('Error cargando tareas del mes:', tasksRes.error);
        showToast(translate(locale, 'hooks.weekLoadError'), 'error');
      }

      const checkInMap = new Map<string, MonthCheckIn>();
      for (const row of checkInsRes.data ?? []) {
        if (row.date && row.emotion) {
          checkInMap.set(row.date, row as MonthCheckIn);
        }
      }

      const allTasks = (tasksRes.data ?? []) as Task[];
      const parentTasks = allTasks.filter((task) => !task.parent_task_id);
      const subtasks = allTasks.filter((task) => task.parent_task_id);
      const tasksWithSubtasks = parentTasks.map((parent) => ({
        ...parent,
        subtasks: subtasks.filter((st) => st.parent_task_id === parent.id),
      }));

      const byDate: Record<string, Task[]> = {};
      for (const task of tasksWithSubtasks) {
        const dateKey = normalizeScheduledDate(task.scheduled_date);
        if (!dateKey) continue;
        if (!byDate[dateKey]) byDate[dateKey] = [];
        byDate[dateKey].push({ ...task, scheduled_date: dateKey });
      }

      if (requestId !== loadRequestIdRef.current) return;

      setTasksByDate(byDate);
      setDays(
        grid.map((cell) => {
          const checkIn = checkInMap.get(cell.dateStr);
          const dayTasks = byDate[cell.dateStr] ?? [];
          return {
            ...cell,
            emotion: checkIn?.emotion,
            energyLevel: checkIn?.energy_level,
            taskCount: dayTasks.length,
            incompleteCount: dayTasks.filter((t) => !t.is_completed).length,
          };
        }),
      );
    } catch (error) {
      if (requestId !== loadRequestIdRef.current) return;
      logger.error('Error cargando calendario:', error);
      showToast(getErrorMessage(error, locale), 'error');
      setDays(emptyMonthDays(year, monthIndex));
      setTasksByDate({});
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [year, monthIndex, locale, showToast]);

  const appendTaskToDate = useCallback((dateStr: string, task: Task) => {
    loadRequestIdRef.current += 1;
    isLoadingRef.current = false;
    setLoading(false);
    setTasksByDate((prev) => {
      const existing = prev[dateStr] ?? [];
      if (existing.some((entry) => entry.id === task.id)) return prev;
      return { ...prev, [dateStr]: [...existing, task] };
    });
    setDays((prev) =>
      prev.map((day) => {
        if (day.dateStr !== dateStr) return day;
        return {
          ...day,
          taskCount: day.taskCount + 1,
          incompleteCount: task.is_completed ? day.incompleteCount : day.incompleteCount + 1,
        };
      }),
    );
  }, []);

  return { days, tasksByDate, loading, loadMonth, appendTaskToDate };
}
