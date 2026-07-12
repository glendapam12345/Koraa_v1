import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalDateString, getPreviousLocalDateString } from '@/lib/dateLocal';

function optOutKey(userId: string): string {
  return `koraa_hoy_lite_opt_out_v1_${userId}`;
}

function firstLiteDayKey(userId: string): string {
  return `koraa_hoy_first_open_calendar_day_v1_${userId}`;
}

/**
 * Ancla el día 1 lite al completar onboarding (no sobrescribe si ya existe).
 */
export async function seedHoyLiteFirstDayIfUnset(
  userId: string,
  day: string = getLocalDateString(),
): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(firstLiteDayKey(userId));
    if (existing) return;
    await AsyncStorage.setItem(firstLiteDayKey(userId), day);
  } catch {
    /* no-op */
  }
}

/**
 * Vista lite el mismo día calendario en que se completó onboarding.
 * Sin ancla guardada → vista completa (no se infiere al abrir Hoy).
 */
export async function resolveHoyLiteLayout(userId: string): Promise<boolean> {
  try {
    const today = getLocalDateString();
    const firstLiteDay = await AsyncStorage.getItem(firstLiteDayKey(userId));
    if (!firstLiteDay) return false;
    return firstLiteDay === today;
  } catch {
    return false;
  }
}

/** Usuario pidió vista completa: menos compacto, pero el banner del día 1 puede seguir visible. */
export async function isHoyLiteCompactOptedOut(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(optOutKey(userId))) === '1';
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

function secondaryModulesKey(userId: string): string {
  return `hoy_secondary_modules_${userId}_v1`;
}

/**
 * Restaura la vista simplificada del primer día en Hoy (pruebas / QA).
 * No borra tareas ni check-ins — solo preferencias locales de layout.
 */
export async function resetHoyFirstDayPreview(userId: string): Promise<void> {
  const today = getLocalDateString();
  try {
    await AsyncStorage.multiRemove([
      optOutKey(userId),
      secondaryModulesKey(userId),
      dayTwoUnlockKey(userId),
    ]);
    await AsyncStorage.setItem(firstLiteDayKey(userId), today);
  } catch {
    /* no-op */
  }
}

/**
 * Simula el día 2 en Hoy: vista completa con meditación y recomendaciones (pruebas / QA).
 */
export async function simulateHoyDayTwo(userId: string): Promise<void> {
  const yesterday = getPreviousLocalDateString();
  try {
    await AsyncStorage.multiRemove([
      optOutKey(userId),
      secondaryModulesKey(userId),
      dayTwoUnlockKey(userId),
    ]);
    await AsyncStorage.setItem(firstLiteDayKey(userId), yesterday);
  } catch {
    /* no-op */
  }
}

function dayTwoUnlockKey(userId: string): string {
  return `koraa_hoy_day_two_unlock_toast_v1_${userId}`;
}

/**
 * True la primera vez que Hoy deja de ser lite (día 2+).
 * Consume el flag para no repetir el toast.
 */
export async function consumeHoyDayTwoUnlockToast(userId: string): Promise<boolean> {
  try {
    const firstLiteDay = await AsyncStorage.getItem(firstLiteDayKey(userId));
    if (!firstLiteDay) return false;

    const today = getLocalDateString();
    if (firstLiteDay === today) return false;

    const alreadyShown = await AsyncStorage.getItem(dayTwoUnlockKey(userId));
    if (alreadyShown === '1') return false;

    await AsyncStorage.setItem(dayTwoUnlockKey(userId), '1');
    return true;
  } catch {
    return false;
  }
}
