/**
 * Unique source of truth for Ellie on Today.
 * Derived from daily progress, not from the last bubble or tab.
 */
import { getHourOfDay } from '@/lib/timeOfDayContext';

export type HoyEllieDailyState =
  | 'not_started'
  | 'adapting'
  | 'free_day'
  | 'in_progress'
  | 'returning'
  | 'mood_updated'
  | 'plan_done'
  | 'evening'
  | 'day_closed';

/** Night review: 20:00–04:59 (not afternoon). */
export function isHoyEllieEveningClose(hour: number = getHourOfDay()): boolean {
  return hour >= 20 || hour < 5;
}

/**
 * Daily progress → one Ellie state.
 * Unaccepted check-in always resumes emotional review — never skip to the plan.
 * Night / return only after they accepted today’s plan.
 */
export function resolveHoyEllieDailyState(params: {
  hasCheckIn: boolean;
  isReturningLater: boolean;
  isEveningClose: boolean;
  middayDismissed?: boolean;
  checkInJustHappened?: boolean;
  hasTasks?: boolean;
  adaptAccepted?: boolean;
  allFocusDone?: boolean;
  moodUpdated?: boolean;
  dayClosed?: boolean;
}): HoyEllieDailyState {
  if (!params.hasCheckIn) return 'not_started';
  if (params.dayClosed) return 'day_closed';
  if (!params.adaptAccepted) {
    return params.hasTasks === false ? 'free_day' : 'adapting';
  }
  if (params.isEveningClose && !params.middayDismissed) return 'evening';
  if (params.isReturningLater && !params.middayDismissed) return 'returning';
  if (params.allFocusDone) return 'plan_done';
  if (params.moodUpdated) return 'mood_updated';
  return 'in_progress';
}

/**
 * Hide the plan while Ellie is still confirming how they feel.
 * Show it only for plan preview or after they asked to see today’s steps.
 */
export function shouldHideHoyPlan(
  dailyState: HoyEllieDailyState,
  middayStep: string,
): boolean {
  if (
    dailyState === 'free_day' ||
    dailyState === 'plan_done' ||
    dailyState === 'day_closed' ||
    dailyState === 'mood_updated'
  ) {
    return true;
  }
  if (dailyState === 'adapting') return middayStep !== 'propose';
  if (dailyState === 'evening') return middayStep !== 'okayNext';
  if (dailyState === 'returning') return middayStep !== 'propose';
  return false;
}
