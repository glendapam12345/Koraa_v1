import {
  LOOSE_COMPLETED_RETENTION_DAYS,
  daysSinceLooseCompleted,
  daysUntilLooseCompletedExpiry,
  filterRetainedLooseCompletedTasks,
  isLooseCompletedWithinRetention,
} from '@/lib/looseCompletedRetentionPolicy';

describe('looseCompletedRetention', () => {
  const now = new Date('2026-06-22T12:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps completed loose tasks within retention window', () => {
    const completedAt = new Date(now.getTime() - 2 * 86_400_000).toISOString();
    expect(isLooseCompletedWithinRetention({ completed_at: completedAt, created_at: completedAt })).toBe(
      true,
    );
    expect(daysUntilLooseCompletedExpiry(completedAt, completedAt)).toBe(1);
  });

  it('expires after retention days', () => {
    const completedAt = new Date(
      now.getTime() - LOOSE_COMPLETED_RETENTION_DAYS * 86_400_000,
    ).toISOString();
    expect(isLooseCompletedWithinRetention({ completed_at: completedAt, created_at: completedAt })).toBe(
      false,
    );
    expect(daysSinceLooseCompleted(completedAt, completedAt)).toBe(LOOSE_COMPLETED_RETENTION_DAYS);
  });

  it('falls back to created_at when completed_at is missing', () => {
    const createdAt = new Date(now.getTime() - 1 * 86_400_000).toISOString();
    expect(isLooseCompletedWithinRetention({ completed_at: null, created_at: createdAt })).toBe(true);
  });

  it('filters retained completed tasks only', () => {
    const fresh = {
      id: 'a',
      completed_at: new Date(now.getTime() - 86_400_000).toISOString(),
      created_at: new Date(now.getTime() - 86_400_000).toISOString(),
    };
    const stale = {
      id: 'b',
      completed_at: new Date(now.getTime() - 5 * 86_400_000).toISOString(),
      created_at: new Date(now.getTime() - 5 * 86_400_000).toISOString(),
    };
    expect(filterRetainedLooseCompletedTasks([fresh, stale]).map((task) => task.id)).toEqual(['a']);
  });
});
