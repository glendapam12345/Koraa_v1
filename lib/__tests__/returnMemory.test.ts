import { parseRecentCheckIns, resolveReturnMemoryCue } from '@/lib/returnMemory';

describe('parseRecentCheckIns', () => {
  it('splits today and yesterday', () => {
    const parsed = parseRecentCheckIns(
      [
        { date: '2026-08-15', emotion: 'Tranquila', energy_level: 4, available_time: '2h', focus_level: 'alto' },
        { date: '2026-08-14', emotion: 'abrumada', energy_level: 2 },
      ],
      '2026-08-15',
    );
    expect(parsed.today?.emotion).toBe('Tranquila');
    expect(parsed.today?.energyLevel).toBe(4);
    expect(parsed.memory).toEqual({
      emotionKey: 'abrumada',
      energyLevel: 2,
      daysSince: 1,
    });
  });

  it('uses the latest past visit when there is no check-in today', () => {
    const parsed = parseRecentCheckIns(
      [{ date: '2026-08-14', emotion: 'agotada', energy_level: 1 }],
      '2026-08-15',
    );
    expect(parsed.today).toBeNull();
    expect(parsed.memory?.daysSince).toBe(1);
    expect(parsed.memory?.emotionKey).toBe('agotada');
  });

  it('drops memory older than a week', () => {
    const parsed = parseRecentCheckIns(
      [{ date: '2026-08-01', emotion: 'motivada', energy_level: 4 }],
      '2026-08-15',
    );
    expect(parsed.memory).toBeNull();
  });
});

describe('resolveReturnMemoryCue', () => {
  it('hides when they already checked in today', () => {
    expect(
      resolveReturnMemoryCue({
        hasCheckInToday: true,
        memory: { emotionKey: 'abrumada', energyLevel: 2, daysSince: 1 },
      }),
    ).toBeNull();
  });

  it('remembers a heavy yesterday with a soft start', () => {
    const cue = resolveReturnMemoryCue({
      hasCheckInToday: false,
      memory: { emotionKey: 'abrumada', energyLevel: 3, daysSince: 1 },
    });
    expect(cue?.messageKey).toBe('hoy.rememberYesterdayHeavy');
    expect(cue?.mood).toBe('breathing');
  });

  it('remembers a low-energy yesterday', () => {
    const cue = resolveReturnMemoryCue({
      hasCheckInToday: false,
      memory: { emotionKey: 'tranquila', energyLevel: 2, daysSince: 1 },
    });
    expect(cue?.messageKey).toBe('hoy.rememberYesterdayLow');
    expect(cue?.mood).toBe('sleepy');
  });

  it('uses a light yesterday line for a calm day', () => {
    const cue = resolveReturnMemoryCue({
      hasCheckInToday: false,
      memory: { emotionKey: 'motivada', energyLevel: 4, daysSince: 1 },
    });
    expect(cue?.messageKey).toBe('hoy.rememberYesterday');
    expect(cue?.mood).toBe('happy');
  });

  it('does not say yesterday if they were gone a few days', () => {
    const cue = resolveReturnMemoryCue({
      hasCheckInToday: false,
      memory: { emotionKey: 'ansiosa', energyLevel: 3, daysSince: 3 },
    });
    expect(cue?.messageKey).toBe('hoy.rememberLastTime');
  });
});
