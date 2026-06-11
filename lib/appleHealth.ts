import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, Platform } from 'react-native';
import type { TranslationKey } from '@/lib/i18n';

const STORAGE_KEY = 'koraa_apple_health_connected';

export { getHoySleepCardVariant, SLEEP_EVENING_HOUR } from '@/lib/hoySleepContext';
export type { HoySleepCardVariant } from '@/lib/hoySleepContext';

const HEALTH_SLEEP_URLS = [
  'x-apple-health://Sleep',
  'x-apple-health://com.apple.Health.Sleep',
  'x-apple-health://',
] as const;

type OpenHealthOptions = {
  t: (key: TranslationKey) => string;
  errorKey?: TranslationKey;
};

async function openUrls(urls: readonly string[]): Promise<boolean> {
  for (const url of urls) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
    } catch {
      /* intentar openURL directo */
    }
  }

  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      /* siguiente scheme */
    }
  }

  return false;
}

export function isAppleHealthPlatform(): boolean {
  return Platform.OS === 'ios';
}

export async function getAppleHealthConnected(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw === '1';
  } catch {
    return false;
  }
}

export async function setAppleHealthConnected(connected: boolean): Promise<void> {
  if (connected) {
    await AsyncStorage.setItem(STORAGE_KEY, '1');
    return;
  }
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/** Abre la app Salud; prioriza la sección de sueño si el sistema lo permite. */
export async function openAppleHealthSleep({
  t,
  errorKey = 'appleHealth.openError',
}: OpenHealthOptions): Promise<boolean> {
  if (!isAppleHealthPlatform()) {
    Alert.alert(t('appleHealth.unavailableTitle'), t('appleHealth.unavailableBody'));
    return false;
  }

  const opened = await openUrls(HEALTH_SLEEP_URLS);
  if (!opened) {
    Alert.alert(t('appleHealth.openErrorTitle'), t(errorKey));
  }
  return opened;
}
