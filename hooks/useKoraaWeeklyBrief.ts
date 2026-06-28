import { useState, useEffect, useRef, useMemo } from 'react';
import { buildKoraaWeekContext } from '@/lib/ai/buildWeekContext';
import { fetchKoraaWeeklyBrief } from '@/lib/ai/fetchKoraaWeeklyBrief';
import type { DayTasks } from '@/hooks/useWeekTasks';
import type { WeekDayCheckIn } from '@/hooks/useWeekTasks';
import type { AppLocale } from '@/lib/i18n';

type UseKoraaWeeklyBriefArgs = {
  userId: string | undefined;
  displayName: string;
  locale: AppLocale;
  weekStart: string;
  weekEnd: string;
  weekTasks: DayTasks[];
  checkInsByDate: Record<string, WeekDayCheckIn>;
  enabled?: boolean;
};

/** Brief semanal para Semana — narrativa suave desde koraa-brain. */
export function useKoraaWeeklyBrief({
  userId,
  displayName,
  locale,
  weekStart,
  weekEnd,
  weekTasks,
  checkInsByDate,
  enabled = true,
}: UseKoraaWeeklyBriefArgs) {
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [gentleAdvice, setGentleAdvice] = useState('');
  const [fromAi, setFromAi] = useState(false);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const weekContext = useMemo(
    () =>
      buildKoraaWeekContext({
        locale,
        displayName,
        weekStart,
        weekEnd,
        weekTasks,
        checkInsByDate,
      }),
    [locale, displayName, weekStart, weekEnd, weekTasks, checkInsByDate],
  );

  const briefFetchKey = useMemo(() => {
    if (!weekContext) return null;
    const { totals } = weekContext;
    const todayKey = weekContext.today
      ? `${weekContext.today.emotionKey}_${weekContext.today.energyLevel}`
      : 'none';
    return [
      weekContext.weekStart,
      weekContext.locale,
      totals.openTasks,
      totals.completedTasks,
      totals.checkInDays,
      totals.busiestDayCount,
      todayKey,
    ].join('\0');
  }, [weekContext]);

  useEffect(() => {
    if (!enabled || !weekContext || !briefFetchKey) {
      setHeadline('');
      setSummary('');
      setGentleAdvice('');
      setFromAi(false);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const brief = await fetchKoraaWeeklyBrief(userId, weekContext);
      if (cancelled || requestId !== requestIdRef.current) return;

      setHeadline(brief.headline);
      setSummary(brief.summary);
      setGentleAdvice(brief.gentleAdvice);
      setFromAi(brief.fromAi);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, weekContext, briefFetchKey, enabled]);

  return {
    headline,
    summary,
    gentleAdvice,
    fromAi,
    loading,
    weekContext,
  };
}
