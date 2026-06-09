import { track } from '@/lib/analytics';
import type { TipAction } from '@/lib/tipActions';
import type { TipCategoryId } from '@/lib/tipsTypes';

export function trackTaskCompleted(props: {
  is_subtask: boolean;
  is_priority: boolean;
  has_project: boolean;
  parent_auto?: boolean;
}): void {
  void track('task_completed', props);
}

export type FocusSessionEvent = 'opened' | 'started' | 'paused' | 'completed' | 'abandoned';

export function trackFocusSession(
  event: FocusSessionEvent,
  props?: { remaining_seconds?: number; duration_minutes?: number },
): void {
  void track(`focus_session_${event}`, props);
}

export function trackTipsCategoryOpened(category: TipCategoryId, hasCheckIn: boolean): void {
  void track('tips_category_opened', { category, has_check_in: hasCheckIn });
}

export function trackTipViewed(category: TipCategoryId, tipId: string): void {
  void track('tip_viewed', { category, tip_id: tipId });
}

export function trackTipActionTapped(
  action: TipAction,
  category?: TipCategoryId,
  tipId?: string,
): void {
  void track('tip_action_tapped', {
    action,
    ...(category ? { category } : {}),
    ...(tipId ? { tip_id: tipId } : {}),
  });
}
