import { buildParamiPatternInputKey } from '@/lib/paramiPatternInputKey';
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

describe('buildParamiPatternInputKey', () => {
  it('changes when energy changes even if top emotion stays', () => {
    const a = buildParamiPatternInputKey(baseInput());
    const b = buildParamiPatternInputKey(
      baseInput({
        days: [day('2026-08-18', 'tranquila', 2), day('2026-08-19', 'tranquila', 3)],
      }),
    );
    expect(a).not.toEqual(b);
  });

  it('changes when a task is completed without changing task count', () => {
    const a = buildParamiPatternInputKey(baseInput());
    const b = buildParamiPatternInputKey(
      baseInput({
        tasks: [
          task({
            id: 't1',
            is_completed: true,
            completed_at: '2026-08-19T12:00:00.000Z',
          }),
        ],
      }),
    );
    expect(a).not.toEqual(b);
  });
});
