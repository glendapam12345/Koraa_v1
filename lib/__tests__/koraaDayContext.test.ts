import { buildKoraaDayContext } from '@/lib/ai/buildDayContext';
import { applyTipHighlights } from '@/lib/ai/applyTipHighlights';
import type { ScoredTip } from '@/lib/tipsPersonalization';

describe('buildKoraaDayContext', () => {
  it('returns null without mood or energy', () => {
    expect(
      buildKoraaDayContext({
        locale: 'es',
        displayName: 'Pam',
        todayMood: null,
        todayEmotionLabel: '',
        energyLevel: 0,
        availableTime: '2-4 hrs',
        focusLevel: 'Algo distraída',
        suggestion: '',
        focusCount: 0,
        focusTasks: [],
        pendingCount: 0,
        date: '2026-06-24',
      }),
    ).toBeNull();
  });

  it('builds unified day context for brain requests', () => {
    const ctx = buildKoraaDayContext({
      locale: 'es',
      displayName: 'Pamela',
      todayMood: 'ansiosa',
      todayEmotionLabel: 'Ansiosa',
      energyLevel: 2,
      availableTime: 'Poco (1-2hrs)',
      focusLevel: 'Muy distraída',
      suggestion: 'Dos pasos suaves pueden bastar.',
      focusCount: 2,
      focusTasks: [{ id: 't1', content: 'Responder correo' }],
      pendingCount: 12,
      date: '2026-06-24',
    });

    expect(ctx).toEqual({
      locale: 'es',
      date: '2026-06-24',
      displayName: 'Pamela',
      checkIn: {
        emotionKey: 'ansiosa',
        emotionLabel: 'Ansiosa',
        energyLevel: 2,
        availableTime: 'Poco (1-2hrs)',
        focusLevel: 'Muy distraída',
      },
      plan: {
        suggestion: 'Dos pasos suaves pueden bastar.',
        focusCount: 2,
        focusTasks: [{ id: 't1', content: 'Responder correo' }],
        pendingCount: 12,
      },
    });
  });
});

describe('applyTipHighlights', () => {
  const tips = [
    { id: 'a', category: 'mindset', title: 'A', body: '', emoji: '', score: 1 },
    { id: 'b', category: 'rest', title: 'B', body: '', emoji: '', score: 2 },
    { id: 'c', category: 'action', title: 'C', body: '', emoji: '', score: 3 },
  ] as ScoredTip[];

  it('moves highlighted tips to the front and marks forYou', () => {
    const result = applyTipHighlights(tips, ['c', 'a']);
    expect(result.map((tip) => tip.id)).toEqual(['c', 'a', 'b']);
    expect(result[0].forYou).toBe(true);
    expect(result[1].forYou).toBe(true);
    expect(result[2].forYou).toBe(false);
  });
});
