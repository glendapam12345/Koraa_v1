import { periodDayCount, slicePeriodData } from '@/lib/checkInPeriod';
import type { DayData } from '@/lib/checkInDayData';

describe('checkInPeriod', () => {
  const sample: DayData[] = Array.from({ length: 30 }, (_, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    hasCheckIn: i % 2 === 0,
    dayLabel: 'Lun',
  }));

  it('returns day counts per period', () => {
    expect(periodDayCount('week')).toBe(7);
    expect(periodDayCount('twoWeeks')).toBe(14);
    expect(periodDayCount('month')).toBe(30);
  });

  it('slices trailing days for selected period', () => {
    expect(slicePeriodData(sample, 'week')).toHaveLength(7);
    expect(slicePeriodData(sample, 'month')).toHaveLength(30);
    expect(slicePeriodData(sample, 'week')[0]?.date).toBe('2026-01-24');
  });
});
