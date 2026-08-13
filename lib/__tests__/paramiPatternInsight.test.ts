import { buildParamiPatternInsight } from '@/lib/paramiPatternInsight';
import type { DayData } from '@/lib/checkInDayData';

function day(date: string, emotion: string, energy: number): DayData {
  return {
    date,
    dayLabel: date.slice(8),
    hasCheckIn: true,
    emotion,
    energyLevel: energy,
  };
}

describe('buildParamiPatternInsight', () => {
  it('returns gentle fallback with few check-ins', () => {
    const result = buildParamiPatternInsight({
      locale: 'es',
      period: 'week',
      days: [day('2026-06-01', 'tranquila', 3)],
      emotionMix: [{ id: 'tranquila', count: 1, color: '#aaa' }],
    });

    expect(result.headline).toContain('ritmo');
    expect(result.summary).toContain('check-in');
  });

  it('mentions top emotion with enough data', () => {
    const days = [
      day('2026-06-01', 'tranquila', 4),
      day('2026-06-02', 'tranquila', 3),
      day('2026-06-03', 'ansiosa', 2),
      day('2026-06-04', 'tranquila', 4),
    ];
    const result = buildParamiPatternInsight({
      locale: 'es',
      period: 'week',
      days,
      emotionMix: [{ id: 'tranquila', count: 3, color: '#aaa' }],
    });

    expect(result.summary).toContain('4');
    expect(result.patternNote.length).toBeGreaterThan(10);
    expect(result.gentleTip.length).toBeGreaterThan(10);
    expect(result.source).toBe('feel');
    expect(result.correlationLabel).toBeTruthy();
    expect(result.applyMode).toBe('open_hoy');
  });

  it('prefers work insight for premium when completions follow energy', () => {
    const days = [
      day('2026-08-03', 'motivada', 5),
      day('2026-08-04', 'motivada', 4),
      day('2026-08-05', 'agotada', 2),
      day('2026-08-06', 'agotada', 1),
    ];
    const result = buildParamiPatternInsight({
      locale: 'es',
      period: 'week',
      days,
      emotionMix: [{ id: 'motivada', count: 2, color: '#aaa' }],
      isPremium: true,
      tasks: [
        { id: 'a', is_completed: true, completed_at: '2026-08-03T16:00:00', scheduled_date: '2026-08-03' },
        { id: 'b', is_completed: true, completed_at: '2026-08-03T17:00:00', scheduled_date: '2026-08-03' },
        { id: 'c', is_completed: true, completed_at: '2026-08-04T16:00:00', scheduled_date: '2026-08-04' },
        { id: 'd', is_completed: true, completed_at: '2026-08-04T18:00:00', scheduled_date: '2026-08-04' },
      ],
    });

    expect(result.source).toBe('work');
    expect(result.patternNote.toLowerCase()).toContain('energía');
    expect(result.applyMode).toBe('one_step');
    expect(result.correlationLabel?.toLowerCase()).toContain('ánimo');
  });
});
