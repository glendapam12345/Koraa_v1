import { useMemo, useCallback } from 'react';
import {
  buildHoyFocusSummaryLine,
  computePrioritizationPlan,
  getTaskPriorityInsight,
} from '@/lib/smartPrioritization';
import { buildHoyPriorityExplanation } from '@/lib/hoyPriorityExplanation';
import type { Task } from '@/components/tasks/TaskCard';
import type { AppLocale } from '@/lib/i18n';

type UseHoyPrioritizationOptions = {
  tasks: Task[];
  incompleteTasks: Task[];
  todayMood: string | null;
  todayEmotionLabel: string;
  energyLevel: number;
  time: string;
  focusLevel: string;
  locale: AppLocale;
  t: (key: string, params?: Record<string, string | number>) => string;
};

export function useHoyPrioritization({
  tasks,
  incompleteTasks,
  todayMood,
  todayEmotionLabel,
  energyLevel,
  time,
  focusLevel,
  locale,
  t,
}: UseHoyPrioritizationOptions) {
  const explanation = useMemo(
    () =>
      buildHoyPriorityExplanation({
        todayMood,
        energyLevel,
        time,
        focusLevel,
        incompleteTasks,
        tasks,
        locale,
        t,
      }),
    [todayMood, energyLevel, time, focusLevel, incompleteTasks, tasks, locale, t],
  );

  const prioritizationPlan = useMemo(() => {
    if (!todayMood || energyLevel <= 0 || !time || !focusLevel) return null;
    return computePrioritizationPlan(
      tasks,
      {
        energyLevel,
        emotion: todayMood,
        availableTime: time,
        focusLevel,
      },
      locale,
    );
  }, [tasks, todayMood, energyLevel, time, focusLevel, locale]);

  const focusSummaryLine = useMemo(() => {
    if (!prioritizationPlan || !todayMood || !time || !focusLevel) return null;
    return buildHoyFocusSummaryLine(
      prioritizationPlan,
      {
        energyLevel,
        emotion: todayMood,
        availableTime: time,
        focusLevel,
      },
      locale,
      todayEmotionLabel,
    );
  }, [
    prioritizationPlan,
    todayMood,
    energyLevel,
    time,
    focusLevel,
    locale,
    todayEmotionLabel,
  ]);

  const getTaskPriorityInsightForList = useCallback(
    (taskId: string) => {
      if (!todayMood || !prioritizationPlan) return undefined;
      const insight = getTaskPriorityInsight(taskId, prioritizationPlan, locale);
      if (insight.whyUp.length === 0 && insight.whyDown.length === 0) return undefined;
      return insight;
    },
    [todayMood, prioritizationPlan, locale],
  );

  return {
    explanation,
    prioritizationPlan,
    focusSummaryLine,
    getTaskPriorityInsightForList,
  };
}
