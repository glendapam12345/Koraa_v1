jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'storeClient' },
  ExecutionEnvironment: { StoreClient: 'storeClient', Standalone: 'standalone' },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import {
  canProcessInAppPurchases,
  isExpoGoClient,
  isNativeMobilePlatform,
} from '@/lib/subscriptionEnvironment';

describe('subscriptionEnvironment', () => {
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  });

  it('detects Expo Go client', () => {
    (Constants as { executionEnvironment: string }).executionEnvironment =
      ExecutionEnvironment.StoreClient;
    expect(isExpoGoClient()).toBe(true);
    expect(canProcessInAppPurchases()).toBe(false);
  });

  it('allows purchases on standalone iOS build', () => {
    (Constants as { executionEnvironment: string }).executionEnvironment =
      ExecutionEnvironment.Standalone;
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    expect(isExpoGoClient()).toBe(false);
    expect(isNativeMobilePlatform()).toBe(true);
    expect(canProcessInAppPurchases()).toBe(true);
  });

  it('disallows purchases on web', () => {
    (Constants as { executionEnvironment: string }).executionEnvironment =
      ExecutionEnvironment.Standalone;
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    expect(canProcessInAppPurchases()).toBe(false);
  });
});
