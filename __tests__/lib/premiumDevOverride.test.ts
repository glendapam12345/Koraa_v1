import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPremiumDevSimEnabled,
  isPremiumDevSimAllowed,
  setPremiumDevSimEnabled,
  subscribePremiumDevOverride,
} from '@/lib/premiumDevOverride';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('premiumDevOverride', () => {
  const originalDev = (global as { __DEV__?: boolean }).__DEV__;

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (global as { __DEV__?: boolean }).__DEV__ = true;
  });

  afterAll(() => {
    (global as { __DEV__?: boolean }).__DEV__ = originalDev;
  });

  it('returns false when __DEV__ is off', async () => {
    (global as { __DEV__?: boolean }).__DEV__ = false;
    expect(isPremiumDevSimAllowed()).toBe(false);
    await expect(getPremiumDevSimEnabled()).resolves.toBe(false);
    await setPremiumDevSimEnabled(true);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('persists toggle in dev builds', async () => {
    expect(isPremiumDevSimAllowed()).toBe(true);
    await expect(getPremiumDevSimEnabled()).resolves.toBe(false);

    await setPremiumDevSimEnabled(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('koraa_dev_premium_sim_v1', '1');

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('1');
    await expect(getPremiumDevSimEnabled()).resolves.toBe(true);

    await setPremiumDevSimEnabled(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('koraa_dev_premium_sim_v1', '0');
  });

  it('notifies subscribers when toggled in dev', async () => {
    let calls = 0;
    const unsubscribe = subscribePremiumDevOverride(() => {
      calls += 1;
    });

    await setPremiumDevSimEnabled(true);
    expect(calls).toBe(1);

    unsubscribe();
    await setPremiumDevSimEnabled(false);
    expect(calls).toBe(1);
  });
});
