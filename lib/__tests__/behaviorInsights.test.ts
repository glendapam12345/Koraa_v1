import { buildBehaviorInsights, completionsByLocalDate } from '@/lib/behaviorInsights';
import type { DayData } from '@/lib/checkInDayData';

function day(date: string, emotion: string, energy: number): DayData {
  return { date, dayLabel: date.slice(8), hasCheckIn: true, emotion, energyLevel: energy };
}

describe('completionsByLocalDate', () => {
  it('counts completions inside the range', () => {
    const counts = completionsByLocalDate(
      [
        { id: '1', is_completed: true, completed_at: '2026-08-04T18:10:00.000Z', scheduled_date: '2026-08-04' },
        { id: '2', is_completed: true, completed_at: '2026-08-05T15:00:00.000Z', scheduled_date: '2026-08-05' },
        { id: '3', is_completed: false, completed_at: null, scheduled_date: '2026-08-03' },
      ],
      '2026-08-04',
      '2026-08-10',
    );
    expect(counts.get('2026-08-04')).toBe(1);
    expect(counts.get('2026-08-05')).toBe(1);
    expect(counts.get('2026-08-03')).toBeUndefined();
  });
});

describe('buildBehaviorInsights', () => {
  it('links higher energy days with more completions', () => {
    const days = [
      day('2026-08-03', 'motivada', 5),
      day('2026-08-04', 'motivada', 4),
      day('2026-08-05', 'agotada', 2),
      day('2026-08-06', 'agotada', 1),
    ];
    const tasks = [
      { id: 'a', is_completed: true, completed_at: '2026-08-03T16:00:00', scheduled_date: '2026-08-03' },
      { id: 'b', is_completed: true, completed_at: '2026-08-03T17:00:00', scheduled_date: '2026-08-03' },
      { id: 'c', is_completed: true, completed_at: '2026-08-04T16:00:00', scheduled_date: '2026-08-04' },
      { id: 'd', is_completed: true, completed_at: '2026-08-04T18:00:00', scheduled_date: '2026-08-04' },
    ];
    const insights = buildBehaviorInsights(days, tasks, 'es', '2026-08-07');
    expect(insights[0]?.type).toBe('energy');
    expect(insights[0]?.message.toLowerCase()).toContain('energía');
  });

  it('names the afternoon window when most completions land there', () => {
    const days = [
      day('2026-08-03', 'tranquila', 3),
      day('2026-08-04', 'tranquila', 3),
      day('2026-08-05', 'tranquila', 3),
      day('2026-08-06', 'tranquila', 3),
    ];
    const tasks = [
      { id: '1', is_completed: true, completed_at: '2026-08-03T15:00:00', scheduled_date: '2026-08-03' },
      { id: '2', is_completed: true, completed_at: '2026-08-04T16:00:00', scheduled_date: '2026-08-04' },
      { id: '3', is_completed: true, completed_at: '2026-08-05T14:30:00', scheduled_date: '2026-08-05' },
      { id: '4', is_completed: true, completed_at: '2026-08-06T17:10:00', scheduled_date: '2026-08-06' },
    ];
    const insights = buildBehaviorInsights(days, tasks, 'es', '2026-08-07');
    const hour = insights.find((item) => item.type === 'hour');
    expect(hour?.message.toLowerCase()).toContain('tarde');
  });

  it('returns empty when there is not enough paired data', () => {
    const insights = buildBehaviorInsights(
      [day('2026-08-03', 'tranquila', 3)],
      [],
      'es',
      '2026-08-07',
    );
    expect(insights).toEqual([]);
  });
});
