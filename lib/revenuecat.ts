import { Platform } from 'react-native';
import { LOG_LEVEL } from 'react-native-purchases';
import { getRevenueCatApiKey } from '@/config/revenuecat';
import { logger } from '@/lib/logger';

let configured = false;

export async function initializeRevenueCat() {
  if (configured || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return;

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    logger.warn('RevenueCat API key no configurada. Se omite inicialización.');
    return;
  }

  try {
    const Purchases = (await import('react-native-purchases')).default;
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    await Purchases.configure({ apiKey });
    configured = true;
    logger.info(`RevenueCat inicializado (${Platform.OS}).`);
  } catch (error) {
    logger.warn('No se pudo inicializar RevenueCat. Si usas Expo Go, es esperado:', error);
  }
}
