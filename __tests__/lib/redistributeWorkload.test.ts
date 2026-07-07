import { redistributeTaskDates } from '@/lib/redistributeWorkload';

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
