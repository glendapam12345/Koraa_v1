import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const ENTITLEMENT_ID = 'premium';

function readExtraKey(key: string): string | null {
  const fromExpoConfig = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.[key];
  if (typeof fromExpoConfig === 'string' && fromExpoConfig.trim()) return fromExpoConfig.trim();

  const fromManifest2 = (Constants.manifest2 as { extra?: Record<string, unknown> } | null)?.extra?.[key];
  if (typeof fromManifest2 === 'string' && fromManifest2.trim()) return fromManifest2.trim();

  const fromManifest = (Constants.manifest as { extra?: Record<string, unknown> } | null)?.extra?.[key];
  if (typeof fromManifest === 'string' && fromManifest.trim()) return fromManifest.trim();

  return null;
}

export function getRevenueCatApiKey(): string | null {
  if (Platform.OS === 'ios') {
    return readExtraKey('revenueCatApiKeyIOS');
  }
  if (Platform.OS === 'android') {
    return readExtraKey('revenueCatApiKeyAndroid');
  }
  return null;
}
