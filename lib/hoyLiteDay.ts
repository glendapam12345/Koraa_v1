import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalDateString, getPreviousLocalDateString } from '@/lib/dateLocal';

function optOutKey(userId: string): string {
  return `koraa_hoy_lite_opt_out_v1_${userId}`;
}

function firstOpenDayKey(userId: string): string {
  return `koraa_hoy_first_open_calendar_day_v1_${userId}`;
}

/**
 * Primer día calendario en que el usuario abre Hoy: mismo día que la primera apertura.
 * Día siguiente (local) → vista completa. El banner de orientación sigue visible todo ese día.
 */
export async function resolveHoyLiteLayout(userId: string): Promise<boolean> {
  try {
    const today = getLocalDateString();
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
    await AsyncStorage.multiRemove([optOutKey(userId), secondaryModulesKey(userId)]);
    await AsyncStorage.setItem(firstOpenDayKey(userId), today);
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
    await AsyncStorage.multiRemove([optOutKey(userId), secondaryModulesKey(userId)]);
    await AsyncStorage.setItem(firstOpenDayKey(userId), yesterday);
  } catch {
    /* no-op */
  }
}
