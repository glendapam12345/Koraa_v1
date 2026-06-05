import { buildHoyEmotionalMemoryInsights } from '@/lib/hoyEmotionalMemory';

const t = (key: string, params?: Record<string, string | number>) => {
  if (params?.day) return `${key}:${params.day}`;
  if (params?.emotion) return `${key}:${params.emotion}`;
  return key;
};

describe('buildHoyEmotionalMemoryInsights', () => {
  it('returns empty array with fewer than 4 rows', () => {
    expect(
      buildHoyEmotionalMemoryInsights(
        [
          { date: '2026-06-01', energy_level: 3, emotion: 'tranquila' },
          { date: '2026-06-02', energy_level: 2, emotion: 'agotada' },
        ],
        t,
      ),
    ).toEqual([]);
  });

  it('returns at least one insight with enough data', () => {
    const rows = Array.from({ length: 8 }, (_, i) => ({
      date: `2026-05-${String(i + 1).padStart(2, '0')}`,
      energy_level: i % 2 === 0 ? 2 : 4,
      emotion: i % 2 === 0 ? 'agotada' : 'motivada',
    }));

    const insights = buildHoyEmotionalMemoryInsights(rows, t);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].title).toBe('hoy.emotionalMemory');
    expect(insights.length).toBeLessThanOrEqual(3);
  });
});
