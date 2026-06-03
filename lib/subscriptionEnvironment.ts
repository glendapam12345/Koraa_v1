import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/** App abierta desde el cliente Expo Go (StoreClient). */
export function isExpoGoClient(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

export function isNativeMobilePlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Compras in-app (StoreKit / Play Billing) solo en binario nativo:
 * TestFlight, App Store o development build — no en Expo Go ni web.
 */
export function canProcessInAppPurchases(): boolean {
  return isNativeMobilePlatform() && !isExpoGoClient();
}
