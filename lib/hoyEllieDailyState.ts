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
 * Closed / night win. Afternoon return wins over a mood update until they accept.
 * Adapt / free-day only right after check-in in this visit.
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
  if (params.isEveningClose && !params.middayDismissed) return 'evening';
  if (params.allFocusDone) return 'plan_done';
  if (params.isReturningLater && !params.middayDismissed) return 'returning';
  if (params.moodUpdated) return 'mood_updated';
  if (params.checkInJustHappened && !params.adaptAccepted) {
    return params.hasTasks ? 'adapting' : 'free_day';
  }
  return 'in_progress';
}

/** Hide the plan until they reach a step that needs it (propose, night leftover, in progress). */
export function shouldHideHoyPlan(
  dailyState: HoyEllieDailyState,
  middayStep: string,
): boolean {
  if (
    dailyState === 'free_day' ||
    dailyState === 'plan_done' ||
    dailyState === 'day_closed' ||
    dailyState === 'mood_updated' ||
    dailyState === 'adapting'
  ) {
    return true;
  }
  if (dailyState === 'evening') return middayStep !== 'okayNext';
  if (dailyState === 'returning') return middayStep !== 'propose';
  return false;
}
