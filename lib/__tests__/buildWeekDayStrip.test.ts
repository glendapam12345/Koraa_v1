import { buildSemanaWeekStrip } from '@/lib/semana/buildWeekDayStrip';

describe('buildSemanaWeekStrip', () => {
  it('returns 7 days starting Monday of selected week', () => {
    // Wednesday 2026-07-08 → week Mon 2026-07-06 … Sun 2026-07-12
    const days = buildSemanaWeekStrip(
      '2026-07-08',
      '2026-07-10',
      {
        '2026-07-08': { energy_level: 2 },
      },
      { '2026-07-08': 3 },
    );

    expect(days).toHaveLength(7);
    expect(days[0].dateStr).toBe('2026-07-06');
    expect(days[6].dateStr).toBe('2026-07-12');
    expect(days.find((d) => d.dateStr === '2026-07-08')?.energyLevel).toBe(2);
    expect(days.find((d) => d.dateStr === '2026-07-08')?.taskCount).toBe(3);
    expect(days.find((d) => d.dateStr === '2026-07-10')?.isToday).toBe(true);
  });
});
