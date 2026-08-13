import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { DayData } from '@/lib/checkInDayData';
import type { YoHistoryEntry } from '@/components/yo/YoCheckInHistory';
import { getLocalDateString } from '@/lib/dateLocal';
import type { BehaviorTaskSnapshot } from '@/lib/behaviorInsights';

const DEFAULT_PROGRESS_DAYS = 30;

function formatHistoryDateLabel(dateStr: string, monthNames: readonly string[]): string {
  const dayNum = parseInt(dateStr.slice(8, 10), 10);
  const month = monthNames[parseInt(dateStr.slice(5, 7), 10) - 1];
  return `${dayNum} ${month}`;
}

export type CheckInInsightsConfig = {
  /** Días hacia atrás para progressData (default 30). */
  progressDays?: number;
  /** Si false, no construye historial (p. ej. Consejos). */
  includeHistory?: boolean;
};

export function useCheckInInsightsData(
  monthNames: readonly string[],
  dayLabels: readonly string[],
  config: CheckInInsightsConfig = {},
) {
  const progressDays = config.progressDays ?? DEFAULT_PROGRESS_DAYS;
  const includeHistory = config.includeHistory ?? true;

  const [progressData, setProgressData] = useState<DayData[]>([]);
  const [historyEntries, setHistoryEntries] = useState<YoHistoryEntry[]>([]);
  const [behaviorTasks, setBehaviorTasks] = useState<BehaviorTaskSnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (userId: string) => {
      setLoading(true);
      const today = new Date();
      const checkInMap = new Map<string, { emotion: string; energy_level: number }>();

      const rangeStartDate = new Date(today);
      rangeStartDate.setDate(today.getDate() - (progressDays - 1));
      const rangeStart = getLocalDateString(rangeStartDate);
      const rangeEnd = getLocalDateString(today);

      const [{ data: rows }, { data: taskRows }] = await Promise.all([
        supabase
          .from('daily_check_ins')
          .select('date, emotion, energy_level')
          .eq('user_id', userId)
          .gte('date', rangeStart)
          .lte('date', rangeEnd)
          .order('date', { ascending: true }),
        supabase
          .from('tasks')
          .select('id, is_completed, completed_at, scheduled_date')
          .eq('user_id', userId)
          .or(`completed_at.gte.${rangeStart},scheduled_date.gte.${rangeStart}`),
      ]);

      for (const row of rows ?? []) {
        if (row.date && row.emotion) {
          checkInMap.set(row.date, {
            emotion: row.emotion,
            energy_level: row.energy_level,
          });
        }
      }

      const days: DayData[] = [];
      for (let i = progressDays - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = getLocalDateString(date);
        const checkInData = checkInMap.get(dateString);
        days.push({
          date: dateString,
          hasCheckIn: !!checkInData,
          dayLabel: dayLabels[date.getDay()] ?? '',
          emotion: checkInData?.emotion,
          energyLevel: checkInData?.energy_level,
        });
      }
      setProgressData(days);
      setBehaviorTasks(
        (taskRows ?? []).flatMap((row) => {
          if (!row.id) return [];
          return [
            {
              id: String(row.id),
              is_completed: Boolean(row.is_completed),
              completed_at: row.completed_at ? String(row.completed_at) : null,
              scheduled_date: row.scheduled_date ? String(row.scheduled_date) : null,
            },
          ];
        }),
      );

      if (includeHistory) {
        const history: YoHistoryEntry[] = (rows ?? [])
          .filter((row) => row.date && row.emotion)
          .reverse()
          .map((row) => ({
            date: row.date as string,
            dateLabel: formatHistoryDateLabel(row.date as string, monthNames),
            emotion: (row.emotion as string).toLowerCase(),
            energyLevel: row.energy_level as number,
          }));
        setHistoryEntries(history);
      } else {
        setHistoryEntries([]);
      }

      setLoading(false);
    },
    [monthNames, dayLabels, progressDays, includeHistory],
  );

  return { progressData, historyEntries, behaviorTasks, loading, load };
}
