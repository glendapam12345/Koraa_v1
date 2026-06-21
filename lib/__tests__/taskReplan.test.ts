import {
  getNextWeekDateString,
  getTomorrowDateString,
} from '@/lib/taskReplanDates';

describe('taskReplan', () => {
  it('computes tomorrow from a fixed date', () => {
    const base = new Date(2026, 5, 16);
    expect(getTomorrowDateString(base)).toBe('2026-06-17');
  });

  it('computes next week from a fixed date', () => {
    const base = new Date(2026, 5, 16);
    expect(getNextWeekDateString(base)).toBe('2026-06-23');
  });
});
