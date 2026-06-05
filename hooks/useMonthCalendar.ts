import { useCallback, useRef, useState } from 'react';
import { supabase, getErrorMessage, isSchemaError } from '@/lib/supabase';
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

export function useMonthCalendar(
  year: number,
  monthIndex: number,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void,
  locale: AppLocale = 'es',
) {
  const [days, setDays] = useState<CalendarDayData[]>([]);
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);
  const isLoadingRef = useRef(false);

  const loadMonth = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);

    const grid = buildMonthGrid(year, monthIndex);
    const { start, end } = getMonthBounds(year, monthIndex);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDays(
          grid.map((cell) => ({
            ...cell,
            taskCount: 0,
            incompleteCount: 0,
          })),
        );
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

      const byDate: Record<string, Task[]> = {};
      for (const task of (tasksRes.data ?? []) as Task[]) {
        const dateKey = normalizeScheduledDate(task.scheduled_date);
        if (!dateKey || task.parent_task_id) continue;
        if (!byDate[dateKey]) byDate[dateKey] = [];
        byDate[dateKey].push({ ...task, scheduled_date: dateKey });
      }

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
      logger.error('Error cargando calendario:', error);
      showToast(getErrorMessage(error, locale), 'error');
      setDays(
        grid.map((cell) => ({
          ...cell,
          taskCount: 0,
          incompleteCount: 0,
        })),
      );
      setTasksByDate({});
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [year, monthIndex, locale, showToast]);

  return { days, tasksByDate, loading, loadMonth };
}
