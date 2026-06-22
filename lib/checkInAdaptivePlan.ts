import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dateLocal';
import type { AppLocale } from '@/lib/i18n';
import {
  applyDayReplanAssignments,
  buildDayReplanPlan,
} from '@/lib/vnext/executeDayReflectionReplan';
import { prioritizeTasksIntelligently } from '@/lib/smartPrioritization';
import type { Task } from '@/components/tasks/TaskCard';
import type { WhatChangedReason } from '@/lib/lifeAreas/types';
import { getHoyTodayPlanTasks } from '@/lib/hoyFocusTasks';
import { saveCheckInReplanSummary, type CheckInReplanSummary } from '@/lib/checkInReplanSummary';
import {
  inferReorganizeReasonFromCheckIn,
  type CheckInAdaptiveInput,
} from '@/lib/checkInReorganizeReason';

export type { CheckInAdaptiveInput } from '@/lib/checkInReorganizeReason';
export { inferReorganizeReasonFromCheckIn } from '@/lib/checkInReorganizeReason';

export type CheckInAdaptivePlanInput = CheckInAdaptiveInput & {
  locale: AppLocale;
};

async function demoteMovedTasksFromPriority(
  userId: string,
  movedIds: string[],
  reason: WhatChangedReason,
): Promise<void> {
  if (reason !== 'tired' && reason !== 'less_time') return;
  if (movedIds.length === 0) return;

  await supabase
    .from('tasks')
    .update({ is_priority: false })
    .in('id', movedIds)
    .eq('user_id', userId);
}

/** En días con poco plan y buena energía, sube 1–2 pasos más al foco de hoy. */
async function boostThinPlanPriorities(
  userId: string,
  input: CheckInAdaptivePlanInput,
): Promise<number> {
  if (input.energyLevel < 4) return 0;

  const today = getLocalDateString();
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_completed', false)
    .is('parent_task_id', null);

  if (error || !tasks?.length) return 0;

  const planCount = getHoyTodayPlanTasks(tasks as Task[], today).length;
  const target = input.energyLevel >= 5 ? 4 : 3;
  const slots = Math.max(0, target - planCount);
  if (slots === 0) return 0;

  const mainTasks = (tasks as Task[]).filter((task) => !task.parent_task_id);
  const ranked = prioritizeTasksIntelligently(
    mainTasks,
    {
      energyLevel: input.energyLevel,
      emotion: input.emotion,
      availableTime: input.availableTime,
      focusLevel: input.focusLevel,
    },
    input.locale,
  );

  const alreadyPriority = new Set(
    mainTasks.filter((task) => task.is_priority).map((task) => task.id),
  );

  const toPromote = ranked
    .filter((task) => !alreadyPriority.has(task.id))
    .slice(0, slots);

  if (toPromote.length === 0) return 0;

  const ids = toPromote.map((task) => task.id);
  await supabase.from('tasks').update({ is_priority: true }).in('id', ids).eq('user_id', userId);

  const unscheduledIds = toPromote
    .filter((task) => !(task as Task).scheduled_date)
    .map((task) => task.id);

  if (unscheduledIds.length > 0) {
    await supabase
      .from('tasks')
      .update({ scheduled_date: today })
      .in('id', unscheduledIds)
      .eq('user_id', userId);
  }

  return toPromote.length;
}

/**
 * Tras el check-in: reorganiza fechas y ajusta el plan según cómo te sientes.
 * Complementa `prioritizeTasksForCheckIn` (que solo marca prioridades).
 */
export async function applyCheckInAdaptivePlan(
  userId: string,
  input: CheckInAdaptivePlanInput,
  looseLabel: string,
): Promise<CheckInReplanSummary | null> {
  const today = getLocalDateString();

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, scheduled_date, is_priority, is_completed, parent_task_id')
    .eq('user_id', userId)
    .eq('is_completed', false)
    .is('parent_task_id', null);

  const todayPlanCount = getHoyTodayPlanTasks((tasks ?? []) as Task[], today).length;
  const reason = inferReorganizeReasonFromCheckIn(input, todayPlanCount);

  const built = await buildDayReplanPlan(userId, reason, input.locale, looseLabel);
  if (!built.ok) return null;

  let movedCount = 0;
  let boostedCount = 0;

  if (built.assignments.length > 0) {
    const movedIds = built.assignments.map((entry) => entry.id);
    const applied = await applyDayReplanAssignments(userId, built.assignments);
    if (!applied.ok) return null;

    await demoteMovedTasksFromPriority(userId, movedIds, reason);
    movedCount = applied.movedCount;
  }

  if (reason === 'more_energy') {
    boostedCount = await boostThinPlanPriorities(userId, input);
  }

  if (movedCount === 0 && boostedCount === 0) {
    return null;
  }

  const summary: CheckInReplanSummary = {
    movedCount,
    boostedCount,
    headline: built.proposal.headline,
    subline: built.proposal.subline,
    usedAi: built.usedAi,
    reason,
  };

  await saveCheckInReplanSummary(userId, summary);
  return summary;
}
