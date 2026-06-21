import { useMemo } from 'react';
import type { Task } from '@/components/tasks/TaskCard';
import type { AppLocale } from '@/lib/i18n';
import type { HoyAttentionPlan } from '@/lib/hoyAttentionPlan';
import {
  buildHoyDayTimeline,
  pickHoyTimelineTasks,
  type HoyDayTimelineResult,
} from '@/lib/vnext/buildHoyDayTimeline';

type UseHoyDayTimelineOptions = {
  incompleteTasksForToday: Task[];
  focusTasks: Task[];
  projects: { id: string; name: string; color?: string | null }[];
  locale: AppLocale;
  looseLabel: string;
  availableTime?: string;
  attentionPlan?: HoyAttentionPlan | null;
  enabled?: boolean;
};

export function useHoyDayTimeline({
  incompleteTasksForToday,
  focusTasks,
  projects,
  locale,
  looseLabel,
  availableTime,
  attentionPlan,
  enabled = true,
}: UseHoyDayTimelineOptions): HoyDayTimelineResult | null {
  return useMemo(() => {
    if (!enabled) return null;

    const timelineTasks = pickHoyTimelineTasks(incompleteTasksForToday, focusTasks);
    const focusLabel = attentionPlan?.projectName;

    return buildHoyDayTimeline(timelineTasks, projects, locale, looseLabel, {
      focusLabel,
      availableTime,
    });
  }, [
    attentionPlan?.projectName,
    availableTime,
    enabled,
    focusTasks,
    incompleteTasksForToday,
    locale,
    looseLabel,
    projects,
  ]);
}
