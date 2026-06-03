import {
  computeMaxTasksPerDay,
  enumerateDaysInclusive,
  parseISODateOnly,
  redistributeTaskDates,
} from '@/lib/redistributeWorkload';

describe('computeMaxTasksPerDay', () => {
  it('reduces load for negative emotions and low energy', () => {
    expect(computeMaxTasksPerDay(1, 'Poco (1-2hrs)', 'agotada')).toBe(1);
  });

  it('allows more tasks with high energy', () => {
    expect(computeMaxTasksPerDay(5, 'Todo el día', 'motivada')).toBeGreaterThanOrEqual(6);
  });
});

describe('redistributeTaskDates', () => {
  it('spreads tasks across days up to maxPerDay', () => {
    const result = redistributeTaskDates(
      ['a', 'b', 'c', 'd', 'e'],
      '2026-05-22',
      '2026-05-19',
      2,
      'es',
    );
    expect(result.assignments).toHaveLength(5);
    const perDay = new Map<string, number>();
    for (const row of result.assignments) {
      perDay.set(row.scheduled_date, (perDay.get(row.scheduled_date) ?? 0) + 1);
    }
    for (const count of perDay.values()) {
      expect(count).toBeLessThanOrEqual(2);
    }
  });
});
