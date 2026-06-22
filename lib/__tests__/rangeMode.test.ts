import { getLocalDateString } from '@/lib/dateLocal';
import { getNextWeekMonday, getRangeBounds, getWeekMonday } from '@/lib/semana/rangeMode';

describe('rangeMode', () => {
  it('getNextWeekMonday returns Monday after the current week ends', () => {
    const wednesday = '2026-06-17';
    const nextMonday = getNextWeekMonday(wednesday);
    expect(nextMonday).toBe('2026-06-22');
    expect(getWeekMonday(nextMonday)).toBe(nextMonday);
    const { start } = getRangeBounds('week', nextMonday);
    expect(start).toBe('2026-06-22');
  });

  it('getNextWeekMonday from Sunday still points to upcoming Monday', () => {
    const sunday = '2026-06-21';
    expect(getNextWeekMonday(sunday)).toBe('2026-06-22');
  });

  it('getNextWeekMonday is always after today when mid-week', () => {
    const today = getLocalDateString();
    const nextMonday = getNextWeekMonday(today);
    expect(nextMonday > getWeekMonday(today)).toBe(true);
  });
});
