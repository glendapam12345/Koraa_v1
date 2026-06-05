import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { DayData } from '@/components/ProgressChart';
import type { YoHistoryEntry } from '@/components/yo/YoCheckInHistory';
import { getLocalDateString } from '@/lib/dateLocal';

const PROGRESS_DAYS = 30;
const HISTORY_DAYS = 30;

function formatHistoryDateLabel(dateStr: string, monthNames: readonly string[]): string {
  const dayNum = parseInt(dateStr.slice(8, 10), 10);
  const month = monthNames[parseInt(dateStr.slice(5, 7), 10) - 1];
  return `${dayNum} ${month}`;
}

export function useCheckInInsightsData(
  monthNames: readonly string[],
  dayLabels: readonly string[],
) {
  const [progressData, setProgressData] = useState<DayData[]>([]);
  const [historyEntries, setHistoryEntries] = useState<YoHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (userId: string) => {
    setLoading(true);
    const today = new Date();
    const checkInMap = new Map<string, { emotion: string; energy_level: number }>();

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - (HISTORY_DAYS - 1));
    const rangeStart = getLocalDateString(thirtyDaysAgo);
    const rangeEnd = getLocalDateString(today);

    const [progressRes, historyRes] = await Promise.all([
      supabase
        .from('daily_check_ins')
        .select('date, emotion, energy_level')
        .eq('user_id', userId)
        .gte('date', rangeStart)
        .lte('date', rangeEnd)
        .order('date', { ascending: true }),
      supabase
        .from('daily_check_ins')
        .select('date, emotion, energy_level')
        .eq('user_id', userId)
        .gte('date', rangeStart)
        .lte('date', rangeEnd)
        .order('date', { ascending: false }),
    ]);

    for (const row of progressRes.data ?? []) {
      if (row.date && row.emotion) {
        checkInMap.set(row.date, {
          emotion: row.emotion,
          energy_level: row.energy_level,
        });
      }
    }

    const days: DayData[] = [];
    for (let i = PROGRESS_DAYS - 1; i >= 0; i--) {
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

    const history: YoHistoryEntry[] = (historyRes.data ?? [])
      .filter((row) => row.date && row.emotion)
      .map((row) => ({
        date: row.date as string,
        dateLabel: formatHistoryDateLabel(row.date as string, monthNames),
        emotion: (row.emotion as string).toLowerCase(),
        energyLevel: row.energy_level as number,
      }));
    setHistoryEntries(history);
    setLoading(false);
  }, [monthNames, dayLabels]);

  return { progressData, historyEntries, loading, load };
}
