import { buildParamiRhythmSnapshot } from '@/lib/paramiRhythmSnapshot';
import type { DayData } from '@/lib/checkInDayData';

function day(
  partial: Partial<DayData> & Pick<DayData, 'date'>,
): DayData {
  return {
    dayLabel: 'L',
    hasCheckIn: true,
    emotion: 'tranquila',
    energyLevel: 4,
    ...partial,
  };
}

describe('buildParamiRhythmSnapshot', () => {
  it('returns null with fewer than 2 check-ins', () => {
    expect(
      buildParamiRhythmSnapshot([day({ date: '2026-08-13' })], 'es'),
    ).toBeNull();
  });

  it('scores soft when mood is light and energy is high', () => {
    const days = [
      day({ date: '2026-08-12', emotion: 'tranquila', energyLevel: 5 }),
      day({ date: '2026-08-13', emotion: 'motivada', energyLevel: 4 }),
    ];
    const snap = buildParamiRhythmSnapshot(days, 'es');
    expect(snap).not.toBeNull();
    expect(snap!.level).toBe('soft');
    expect(snap!.levelLabel).toBe('Suave');
    expect(snap!.energyBand).toBe('high');
    expect(snap!.moodBand).toBe('high');
    expect(snap!.score).toBeGreaterThanOrEqual(72);
  });

  it('scores tender when load is high', () => {
    const days = [
      day({ date: '2026-08-11', emotion: 'abrumada', energyLevel: 1 }),
      day({ date: '2026-08-12', emotion: 'agotada', energyLevel: 2 }),
      day({ date: '2026-08-13', emotion: 'ansiosa', energyLevel: 1 }),
    ];
    const snap = buildParamiRhythmSnapshot(days, 'en');
    expect(snap!.level).toBe('tender');
    expect(snap!.levelLabel).toBe('Needs care');
    expect(snap!.moodBand).toBe('low');
    expect(snap!.energyBand).toBe('low');
  });
});
