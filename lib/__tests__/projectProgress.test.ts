import { computeProjectProgress, daysUntilDue, formatProjectDueDate } from '@/lib/projectProgress';

describe('projectProgress', () => {
  it('computes percent from total and incomplete', () => {
    expect(computeProjectProgress(4, 1)).toEqual({
      total: 4,
      completed: 3,
      incomplete: 1,
      percent: 75,
    });
  });

  it('returns 0% when empty', () => {
    expect(computeProjectProgress(0, 0).percent).toBe(0);
  });

  it('formats due date', () => {
    const formatted = formatProjectDueDate('2026-06-20', 'es');
    expect(formatted).toContain('2026');
  });

  it('computes days until due', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const iso = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
    expect(daysUntilDue(iso)).toBe(5);
  });
});
