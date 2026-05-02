import AsyncStorage from '@react-native-async-storage/async-storage';

function optOutKey(userId: string): string {
  return `koraa_hoy_lite_opt_out_v1_${userId}`;
}

function firstOpenDayKey(userId: string): string {
  return `koraa_hoy_first_open_calendar_day_v1_${userId}`;
}

function localDateYyyyMmDd(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().split('T')[0];
}

/**
 * Primer día calendario en que el usuario abre Hoy: mismo día que la primera apertura → vista simplificada.
 * Día siguiente (local) → vista completa. El usuario puede saltar con optOutHoyLiteLayout.
 */
export async function resolveHoyLiteLayout(userId: string): Promise<boolean> {
  try {
    if ((await AsyncStorage.getItem(optOutKey(userId))) === '1') {
      return false;
    }
    const today = localDateYyyyMmDd();
    let first = await AsyncStorage.getItem(firstOpenDayKey(userId));
    if (!first) {
      await AsyncStorage.setItem(firstOpenDayKey(userId), today);
      first = today;
    }
    return first === today;
  } catch {
    return false;
  }
}

export async function optOutHoyLiteLayout(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(optOutKey(userId), '1');
  } catch {
    /* no-op */
  }
}
