import { fetchCurrentStreak, isStreakMilestone } from '@/lib/streak';
import { getLocalDateString } from '@/lib/dateLocal';

function makeSupabaseMock(dates: string[]) {
  const lte = jest.fn().mockResolvedValue({ data: dates.map((date) => ({ date })) });
  const gte = jest.fn().mockReturnValue({ lte });
  const eq = jest.fn().mockReturnValue({ gte });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });
  return { from } as unknown as import('@supabase/supabase-js').SupabaseClient;
}

describe('fetchCurrentStreak', () => {
  it('counts consecutive days ending today', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const supabase = makeSupabaseMock([
      getLocalDateString(today),
      getLocalDateString(yesterday),
      getLocalDateString(twoDaysAgo),
    ]);

    await expect(fetchCurrentStreak(supabase, 'user-1')).resolves.toBe(3);
  });

  it('returns 0 when yesterday missing but today present starts streak at 1', async () => {
    const today = new Date();
    const supabase = makeSupabaseMock([getLocalDateString(today)]);
    await expect(fetchCurrentStreak(supabase, 'user-1')).resolves.toBe(1);
  });
});

describe('isStreakMilestone', () => {
  it('detects milestone days', () => {
    expect(isStreakMilestone(7)).toBe(true);
    expect(isStreakMilestone(8)).toBe(false);
  });
});
