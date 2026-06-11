import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'koraa_dev_premium_sim_v1';

type Listener = () => void;
const listeners = new Set<Listener>();

/** Solo builds de desarrollo — simula Premium en Expo Go sin RevenueCat. */
export function isPremiumDevSimAllowed(): boolean {
  return __DEV__;
}

export async function getPremiumDevSimEnabled(): Promise<boolean> {
  if (!isPremiumDevSimAllowed()) return false;
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setPremiumDevSimEnabled(enabled: boolean): Promise<void> {
  if (!isPremiumDevSimAllowed()) return;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    /* no-op */
  }
  listeners.forEach((listener) => listener());
}

export function subscribePremiumDevOverride(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
