import { inferReorganizeReasonFromCheckIn } from '@/lib/checkInReorganizeReason';

const base = {
  locale: 'es' as const,
  availableTime: 'Medio (2-4hrs)',
  focusLevel: 'Normal',
};

describe('inferReorganizeReasonFromCheckIn', () => {
  it('lightens the plan when energy is low', () => {
    expect(
      inferReorganizeReasonFromCheckIn(
        { ...base, emotion: 'agotada', energyLevel: 2 },
        4,
      ),
    ).toBe('tired');
  });

  it('spreads tasks when little time is available', () => {
    expect(
      inferReorganizeReasonFromCheckIn(
        { ...base, emotion: 'tranquila', energyLevel: 3, availableTime: 'Poco (1-2hrs)' },
        3,
      ),
    ).toBe('less_time');
  });

  it('pulls more forward on a light day with good energy', () => {
    expect(
      inferReorganizeReasonFromCheckIn(
        { ...base, emotion: 'motivada', energyLevel: 5 },
        1,
      ),
    ).toBe('more_energy');
  });

  it('reshuffles priorities on a normal day', () => {
    expect(
      inferReorganizeReasonFromCheckIn(
        { ...base, emotion: 'tranquila', energyLevel: 3 },
        4,
      ),
    ).toBe('priorities_changed');
  });
});
