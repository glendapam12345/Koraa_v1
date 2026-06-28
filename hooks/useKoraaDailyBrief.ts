import { useState, useEffect, useRef, useMemo } from 'react';
import { buildKoraaDayContext } from '@/lib/ai/buildDayContext';
import { fetchKoraaDailyBrief } from '@/lib/ai/fetchKoraaDailyBrief';
import { shortlistTasksForAi } from '@/lib/ai/shortlistTasksForAi';
import type { KoraaDayContextFocusTask } from '@/lib/ai/types';
import type { AppLocale } from '@/lib/i18n';
import type { Task } from '@/components/tasks/TaskCard';

type UseKoraaDailyBriefArgs = {
  userId: string | undefined;
  displayName: string;
  todayMood: string | null;
  todayEmotionLabel: string;
  energyLevel: number;
  availableTime: string;
  focusLevel: string;
  suggestion: string;
  focusCount: number;
  focusTasks: KoraaDayContextFocusTask[];
  pendingCount: number;
  locale: AppLocale;
  /** Tareas incompletas para que el cerebro elija foco y orden. */
  incompleteTasks?: Task[];
};

/**
 * Brief diario unificado: coach + tips + plan de foco desde koraa-brain.
 */
export function useKoraaDailyBrief({
  userId,
  displayName,
  todayMood,
  todayEmotionLabel,
  energyLevel,
  availableTime,
  focusLevel,
  suggestion,
  focusCount,
  focusTasks,
  pendingCount,
  locale,
  incompleteTasks = [],
}: UseKoraaDailyBriefArgs) {
  const [coachLine, setCoachLine] = useState('');
  const [tipIds, setTipIds] = useState<string[]>([]);
  const [tipLead, setTipLead] = useState('');
  const [focusTaskIds, setFocusTaskIds] = useState<string[]>([]);
  const [planHeadline, setPlanHeadline] = useState('');
  const [fromAi, setFromAi] = useState(false);
  const [focusFromAi, setFocusFromAi] = useState(false);
  const requestIdRef = useRef(0);

  const taskCandidates = useMemo(() => {
    if (!todayMood || energyLevel <= 0 || !availableTime || !focusLevel) return [];
    const mainTasks = incompleteTasks.filter((task) => !task.is_completed && !task.parent_task_id);
    if (mainTasks.length === 0) return [];
    return shortlistTasksForAi(
      mainTasks,
      {
        emotion: todayMood,
        energyLevel,
        availableTime,
        focusLevel,
      },
      locale,
    );
  }, [incompleteTasks, todayMood, energyLevel, availableTime, focusLevel, locale]);

  const dayContext = useMemo(
    () =>
      buildKoraaDayContext({
        locale,
        displayName,
        todayMood,
        todayEmotionLabel,
        energyLevel,
        availableTime,
        focusLevel,
        suggestion,
        focusCount,
        focusTasks,
        pendingCount,
      }),
    [
      locale,
      displayName,
      todayMood,
      todayEmotionLabel,
      energyLevel,
      availableTime,
      focusLevel,
      suggestion,
      focusCount,
      focusTasks,
      pendingCount,
    ],
  );

  const briefFetchKey = useMemo(() => {
    if (!dayContext) return null;
    const { checkIn, plan } = dayContext;
    return [
      dayContext.locale,
      checkIn.emotionKey,
      checkIn.energyLevel,
      checkIn.availableTime,
      checkIn.focusLevel,
      plan.focusCount,
      plan.suggestion,
      taskCandidates.map((task) => task.id).join(','),
    ].join('\0');
  }, [dayContext, taskCandidates]);

  useEffect(() => {
    if (!dayContext || !briefFetchKey) {
      setCoachLine('');
      setTipIds([]);
      setTipLead('');
      setFocusTaskIds([]);
      setPlanHeadline('');
      setFromAi(false);
      setFocusFromAi(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    let cancelled = false;

    void (async () => {
      const brief = await fetchKoraaDailyBrief(userId, dayContext, { taskCandidates });
      if (cancelled || requestId !== requestIdRef.current) return;

      setCoachLine(brief.coach.actionLine);
      setTipIds(brief.tipIds);
      setTipLead(brief.tipLead);
      setFocusTaskIds(brief.focusTaskIds);
      setPlanHeadline(brief.planHeadline);
      setFromAi(brief.fromAi);
      setFocusFromAi(brief.focusFromAi);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, dayContext, briefFetchKey, taskCandidates]);

  return {
    coachLine,
    tipIds,
    tipLead,
    focusTaskIds,
    planHeadline,
    fromAi,
    focusFromAi,
    dayContext,
  };
}
