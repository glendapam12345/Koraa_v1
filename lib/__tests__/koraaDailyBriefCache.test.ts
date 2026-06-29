import { koraaDailyBriefCacheKey } from '@/lib/ai/koraaDailyBriefCache';
import type { KoraaDayContext } from '@/lib/ai/types';

const baseContext: KoraaDayContext = {
  locale: 'es',
  date: '2026-06-22',
  displayName: 'Ana',
  checkIn: {
    emotionKey: 'tranquila',
    emotionLabel: 'Tranquila',
    energyLevel: 3,
    availableTime: 'Medio (2-4hrs)',
    focusLevel: 'Normal',
  },
  plan: { suggestion: '', focusCount: 0, focusTasks: [], pendingCount: 0 },
};

describe('koraaDailyBriefCacheKey', () => {
  it('includes available time and focus level', () => {
    const base = koraaDailyBriefCacheKey('user-1', baseContext);
    const timeChanged = koraaDailyBriefCacheKey('user-1', {
      ...baseContext,
      checkIn: { ...baseContext.checkIn, availableTime: 'Poco (1-2hrs)' },
    });
    const focusChanged = koraaDailyBriefCacheKey('user-1', {
      ...baseContext,
      checkIn: { ...baseContext.checkIn, focusLevel: 'Enfocada' },
    });

    expect(base).not.toBe(timeChanged);
    expect(base).not.toBe(focusChanged);
  });

  it('includes sorted task candidate ids', () => {
    const one = koraaDailyBriefCacheKey('user-1', baseContext, ['t2', 't1']);
    const two = koraaDailyBriefCacheKey('user-1', baseContext, ['t1', 't2']);
    const three = koraaDailyBriefCacheKey('user-1', baseContext, ['t1', 't2', 't3']);

    expect(one).toBe(two);
    expect(one).not.toBe(three);
  });

  it('changes when energy or emotion changes', () => {
    const base = koraaDailyBriefCacheKey('user-1', baseContext);
    const energy = koraaDailyBriefCacheKey('user-1', {
      ...baseContext,
      checkIn: { ...baseContext.checkIn, energyLevel: 2 },
    });
    const emotion = koraaDailyBriefCacheKey('user-1', {
      ...baseContext,
      checkIn: { ...baseContext.checkIn, emotionKey: 'agotada' },
    });

    expect(base).not.toBe(energy);
    expect(base).not.toBe(emotion);
  });
});
