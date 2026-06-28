import {
  canSuggestWeekReplan,
  inferWeekReplanReason,
} from '@/lib/ai/inferWeekReplanReason';
import type { KoraaWeekContext } from '@/lib/ai/types';

const baseContext: KoraaWeekContext = {
  locale: 'es',
  displayName: 'Pamela',
  weekStart: '2026-06-22',
  weekEnd: '2026-06-28',
  totals: {
    openTasks: 8,
    completedTasks: 2,
    checkInDays: 1,
    busiestDay: '2026-06-22',
    busiestDayName: 'Lun',
    busiestDayCount: 5,
  },
  today: { emotionKey: 'ansiosa', emotionLabel: 'Ansiosa', energyLevel: 2 },
  days: [],
};

describe('inferWeekReplanReason', () => {
  it('returns tired on low energy', () => {
    expect(inferWeekReplanReason(baseContext)).toBe('tired');
  });

  it('returns week_balance when week is uneven', () => {
    expect(
      inferWeekReplanReason({
        ...baseContext,
        today: { emotionKey: 'tranquila', emotionLabel: 'Tranquila', energyLevel: 4 },
      }),
    ).toBe('week_balance');
  });

  it('canSuggestWeekReplan when enough open tasks', () => {
    expect(canSuggestWeekReplan(baseContext)).toBe(true);
    expect(
      canSuggestWeekReplan({
        ...baseContext,
        totals: { ...baseContext.totals, openTasks: 1, busiestDayCount: 1 },
      }),
    ).toBe(false);
  });
});
