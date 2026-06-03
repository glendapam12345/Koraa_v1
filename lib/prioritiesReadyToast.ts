import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'koraa_priorities_ready_toast_v1';

/** Tras check-in en Sentir: Hoy muestra toast al enfocarse si la celebración no llegó a tiempo. */
export async function markPrioritiesReadyToast(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    /* ignore */
  }
}

export async function consumePrioritiesReadyToast(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    if (value !== '1') return false;
    await AsyncStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}
