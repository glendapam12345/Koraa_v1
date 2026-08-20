import { Platform } from 'react-native';
import { getRevenueCatApiKey } from '@/config/revenuecat';
import { logger } from '@/lib/logger';
import { canProcessInAppPurchases } from '@/lib/subscriptionEnvironment';

let configured = false;

export async function initializeRevenueCat() {
  if (configured || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return;
  if (!canProcessInAppPurchases()) {
    return;
  }

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    logger.warn('RevenueCat API key no configurada. Se omite inicialización.');
    return;
  }

  try {
    const { default: Purchases, LOG_LEVEL } = await import('react-native-purchases');
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.WARN);
    }
    await Purchases.configure({ apiKey });
    configured = true;
    logger.info(`RevenueCat inicializado (${Platform.OS}).`);
  } catch (error) {
    logger.warn('No se pudo inicializar RevenueCat. Si usas Expo Go, es esperado:', error);
  }
}
