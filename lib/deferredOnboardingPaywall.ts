import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'koraa_deferred_onboarding_paywall_v1_';

export function getDeferredOnboardingPaywallKey(userId: string): string {
  return `${PREFIX}${userId}`;
}

/** Marca que el paywall debe abrirse después de la primera visita a Hoy. */
export async function scheduleDeferredOnboardingPaywall(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(getDeferredOnboardingPaywallKey(userId), '1');
  } catch {
    /* no bloquear UI */
  }
}

/**
 * True una sola vez si hay paywall pendiente post-onboarding.
 * Consume el flag para no repetir.
 */
export async function consumeDeferredOnboardingPaywall(userId: string): Promise<boolean> {
  try {
    const key = getDeferredOnboardingPaywallKey(userId);
    const pending = await AsyncStorage.getItem(key);
    if (pending !== '1') return false;
    await AsyncStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
