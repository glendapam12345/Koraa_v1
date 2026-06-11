import { buildFallbackEmergencyKitResponse } from '@/lib/emergencyKit/fallbackMessage';
import { isCrisisEvent } from '@/lib/emergencyKit/events';

describe('emergencyKit fallback', () => {
  it('detects crisis for breakup', () => {
    expect(isCrisisEvent('breakup')).toBe(true);
  });

  it('builds compassionate Spanish message', () => {
    const res = buildFallbackEmergencyKitResponse({
      eventId: 'breakup',
      locale: 'es',
      recentEmotions: ['triste', 'solitaria'],
      avgEnergy: 2,
      energyTrend: 'low',
      checkInCount: 5,
      savedItemTitles: [],
      letterSnippets: [],
      preferences: {},
    });
    expect(res.supportMessage).toContain('ruptura');
    expect(res.supportMessage).not.toContain('productividad');
    expect(res.gentleActions.length).toBeGreaterThan(0);
    expect(res.crisisMode).toBe(true);
    expect(res.prioritizedModules[0]).toBe('music');
  });
});
