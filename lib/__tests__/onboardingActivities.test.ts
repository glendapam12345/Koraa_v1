import {
  canAddOnboardingActivity,
  normalizeOnboardingActivities,
  ONBOARDING_MAX_ACTIVITY_LENGTH,
} from '@/lib/onboardingActivities';

describe('onboardingActivities', () => {
  it('deduplicates activities case-insensitively', () => {
    expect(
      normalizeOnboardingActivities(['Cocinar', 'cocinar', '  Yoga  ']),
    ).toEqual(['Cocinar', 'Yoga']);
  });

  it('ignores empty and over-length entries', () => {
    const long = 'a'.repeat(ONBOARDING_MAX_ACTIVITY_LENGTH + 1);
    expect(normalizeOnboardingActivities(['', '   ', long, 'ok'])).toEqual(['ok']);
  });

  it('canAddOnboardingActivity rejects duplicates', () => {
    expect(canAddOnboardingActivity(['Cocinar'], 'cocinar')).toBe(false);
    expect(canAddOnboardingActivity(['Cocinar'], 'Yoga')).toBe(true);
  });
});
