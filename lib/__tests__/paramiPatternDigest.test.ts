import { digestParamiPatternFingerprint, buildParamiPatternInputKey } from '@/lib/paramiPatternInputKey';
import type { ParamiPatternInput } from '@/lib/paramiPatternInsight';
import type { BehaviorTaskSnapshot } from '@/lib/behaviorInsights';
import type { DayData } from '@/lib/checkInDayData';

function day(date: string, emotion: string, energyLevel: number): DayData {
  return {
    date,
    dayLabel: date.slice(8),
    hasCheckIn: true,
    emotion,
    energyLevel,
  } as DayData;
}

function task(partial: Partial<BehaviorTaskSnapshot> & { id: string }): BehaviorTaskSnapshot {
  return {
    is_completed: false,
    completed_at: null,
    scheduled_date: null,
    ...partial,
  };
}

function baseInput(overrides: Partial<ParamiPatternInput> = {}): ParamiPatternInput {
  return {
    locale: 'es',
    period: 'week',
    days: [day('2026-08-18', 'tranquila', 3), day('2026-08-19', 'tranquila', 3)],
    emotionMix: [{ id: 'tranquila', count: 2, color: '#ccc' }],
    tasks: [task({ id: 't1' })],
    isPremium: true,
    ...overrides,
  };
}

describe('digestParamiPatternFingerprint', () => {
  it('is stable for the same fingerprint', () => {
    const fp = buildParamiPatternInputKey(baseInput());
    expect(digestParamiPatternFingerprint(fp)).toEqual(digestParamiPatternFingerprint(fp));
  });

  it('changes when the fingerprint changes', () => {
    const a = digestParamiPatternFingerprint(buildParamiPatternInputKey(baseInput()));
    const b = digestParamiPatternFingerprint(
      buildParamiPatternInputKey(
        baseInput({
          days: [day('2026-08-18', 'tranquila', 2), day('2026-08-19', 'tranquila', 3)],
        }),
      ),
    );
    expect(a).not.toEqual(b);
  });

  it('includes length so short/long collisions are harder', () => {
    const short = digestParamiPatternFingerprint('ab');
    const long = digestParamiPatternFingerprint('a'.repeat(100) + 'b');
    expect(short).not.toEqual(long);
    expect(short).toMatch(/_n/);
  });
});
