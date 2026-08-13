import {
  computeCurrentStreak,
  fetchCurrentStreak,
  isStreakMilestone,
} from '@/lib/streak';
import { getLocalDateString } from '@/lib/dateLocal';

function makeSupabaseMock(dates: string[]) {
  const lte = jest.fn().mockResolvedValue({ data: dates.map((date) => ({ date })) });
  const gte = jest.fn().mockReturnValue({ lte });
  const eq = jest.fn().mockReturnValue({ gte });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });
  return { from } as unknown as import('@supabase/supabase-js').SupabaseClient;
}

function daysAgo(n: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(from.getDate() - n);
  return getLocalDateString(d);
}

describe('computeCurrentStreak', () => {
  const today = new Date(2026, 7, 7, 12, 0, 0);

  it('counts consecutive days ending today', () => {
    const dates = new Set([daysAgo(0, today), daysAgo(1, today), daysAgo(2, today)]);
    expect(computeCurrentStreak(dates, today, { graceDays: 0 })).toEqual({
      streak: 3,
      usedGrace: false,
    });
  });

  it('allows today missing without breaking', () => {
    const dates = new Set([daysAgo(1, today), daysAgo(2, today)]);
    expect(computeCurrentStreak(dates, today, { graceDays: 0 })).toEqual({
      streak: 2,
      usedGrace: false,
    });
  });

  it('uses one grace day for a single gap', () => {
    // today ✓, yesterday ✗, 2d ✓, 3d ✓
    const dates = new Set([daysAgo(0, today), daysAgo(2, today), daysAgo(3, today)]);
    expect(computeCurrentStreak(dates, today, { graceDays: 1 })).toEqual({
      streak: 3,
      usedGrace: true,
    });
  });

  it('breaks on a second gap when grace is exhausted', () => {
    // today ✓, -1 ✗ (grace), -2 ✓, -3 ✗ (break), -4 ✓ ignored
    const dates = new Set([daysAgo(0, today), daysAgo(2, today), daysAgo(4, today)]);
    expect(computeCurrentStreak(dates, today, { graceDays: 1 })).toEqual({
      streak: 2,
      usedGrace: true,
    });
  });

  it('returns 0 when there are no check-ins', () => {
    expect(computeCurrentStreak(new Set(), today, { graceDays: 1 })).toEqual({
      streak: 0,
      usedGrace: false,
    });
  });
});

describe('fetchCurrentStreak', () => {
  it('counts consecutive days ending today', async () => {
    const today = new Date();
    const supabase = makeSupabaseMock([daysAgo(0, today), daysAgo(1, today), daysAgo(2, today)]);
    await expect(fetchCurrentStreak(supabase, 'user-1')).resolves.toBe(3);
  });

  it('returns 1 when only today is present', async () => {
    const today = new Date();
    const supabase = makeSupabaseMock([daysAgo(0, today)]);
    await expect(fetchCurrentStreak(supabase, 'user-1')).resolves.toBe(1);
  });
});

describe('isStreakMilestone', () => {
  it('detects milestone days', () => {
    expect(isStreakMilestone(7)).toBe(true);
    expect(isStreakMilestone(8)).toBe(false);
  });
});
