import { buildKoraaWeekContext } from '@/lib/ai/buildWeekContext';
import type { DayTasks } from '@/hooks/useWeekTasks';

const weekTasks: DayTasks[] = [
  {
    day: { dateStr: '2026-06-22', label: 'Lun 22', dayName: 'Lun', isToday: true },
    tasks: [
      { id: 't1', content: 'Correo', is_completed: false, is_priority: true } as never,
      { id: 't2', content: 'Hecho', is_completed: true, is_priority: false } as never,
    ],
  },
  {
    day: { dateStr: '2026-06-23', label: 'Mar 23', dayName: 'Mar', isToday: false },
    tasks: [{ id: 't3', content: 'Revisar', is_completed: false, is_priority: false } as never],
  },
];

describe('buildKoraaWeekContext', () => {
  it('aggregates open tasks and check-ins', () => {
    const context = buildKoraaWeekContext({
      locale: 'es',
      displayName: 'Pamela',
      weekStart: '2026-06-22',
      weekEnd: '2026-06-28',
      weekTasks,
      checkInsByDate: {
        '2026-06-22': { emotion: 'ansiosa', energy_level: 2 },
      },
    });

    expect(context).not.toBeNull();
    expect(context!.totals.openTasks).toBe(2);
    expect(context!.totals.completedTasks).toBe(1);
    expect(context!.totals.checkInDays).toBe(1);
    expect(context!.totals.busiestDay).toBe('2026-06-22');
    expect(context!.today?.emotionKey).toBe('ansiosa');
    expect(context!.today?.energyLevel).toBe(2);
  });

  it('returns null for empty week', () => {
    expect(
      buildKoraaWeekContext({
        locale: 'es',
        displayName: 'Pam',
        weekStart: '2026-06-22',
        weekEnd: '2026-06-28',
        weekTasks: [],
        checkInsByDate: {},
      }),
    ).toBeNull();
  });
});
