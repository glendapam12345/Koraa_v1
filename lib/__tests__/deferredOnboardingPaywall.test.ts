import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  consumeDeferredOnboardingPaywall,
  getDeferredOnboardingPaywallKey,
  scheduleDeferredOnboardingPaywall,
} from '@/lib/deferredOnboardingPaywall';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('deferredOnboardingPaywall', () => {
  const userId = 'user-paywall';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses a stable storage key', () => {
    expect(getDeferredOnboardingPaywallKey(userId)).toBe(
      'koraa_deferred_onboarding_paywall_v1_user-paywall',
    );
  });

  it('schedules and consumes once', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('1');
    await scheduleDeferredOnboardingPaywall(userId);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      getDeferredOnboardingPaywallKey(userId),
      '1',
    );

    await expect(consumeDeferredOnboardingPaywall(userId)).resolves.toBe(true);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      getDeferredOnboardingPaywallKey(userId),
    );

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    await expect(consumeDeferredOnboardingPaywall(userId)).resolves.toBe(false);
  });
});
