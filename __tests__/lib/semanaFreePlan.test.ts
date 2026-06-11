import { getFreeVisibleWeekTasks, FREE_CALENDAR_VISIBLE_DAYS } from '@/lib/semanaFreePlan';
import type { DayTasks } from '@/hooks/useWeekTasks';

function day(dateStr: string, isToday = false): DayTasks {
  return {
    day: {
      dateStr,
      label: dateStr,
      dayName: 'Mon',
      isToday,
    },
    tasks: [],
  };
}

describe('semanaFreePlan', () => {
  const week = [
    day('2026-06-01'),
    day('2026-06-02'),
    day('2026-06-03'),
    day('2026-06-04'),
    day('2026-06-05', true),
    day('2026-06-06'),
    day('2026-06-07'),
  ];

  it('prioritizes today and following days', () => {
    const { visible, hiddenCount } = getFreeVisibleWeekTasks(week, 3);
    expect(visible.map((d) => d.day.dateStr)).toEqual(['2026-06-05', '2026-06-06', '2026-06-07']);
    expect(hiddenCount).toBe(4);
  });

  it('shows early week when today is Monday', () => {
    const mondayWeek = week.map((entry, index) => ({
      ...entry,
      day: { ...entry.day, isToday: index === 0 },
    }));
    const { visible } = getFreeVisibleWeekTasks(mondayWeek, 3);
    expect(visible.map((d) => d.day.dateStr)).toEqual(['2026-06-01', '2026-06-02', '2026-06-03']);
  });

  it('returns all days when week fits free limit', () => {
    const shortWeek = week.slice(0, 2);
    const { visible, hiddenCount } = getFreeVisibleWeekTasks(shortWeek, FREE_CALENDAR_VISIBLE_DAYS);
    expect(visible).toHaveLength(2);
    expect(hiddenCount).toBe(0);
  });
});
