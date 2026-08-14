import AsyncStorage from '@react-native-async-storage/async-storage';
import { track } from '@/lib/analytics';
import {
  getLocalDateString,
  getNextLocalDateString,
  parseLocalDateString,
} from '@/lib/dateLocal';
import { getHoyLiteFirstOpenDay, seedHoyLiteFirstDayIfUnset } from '@/lib/hoyLiteDay';

function returnedD1TrackedKey(userId: string): string {
  return `koraa_returned_d1_tracked_v1_${userId}`;
}

function cohortDay0TrackedKey(userId: string): string {
  return `koraa_cohort_day0_tracked_v1_${userId}`;
}

/** Diferencia en días calendario locales (AAAA-MM-DD). */
export function localDateDiffDays(fromDay: string, toDay: string): number {
  const a = parseLocalDateString(fromDay).getTime();
  const b = parseLocalDateString(toDay).getTime();
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

/** D1 = exactamente el día calendario siguiente al día 0. */
export function shouldEmitReturnedD1(day0: string, today: string): boolean {
  return localDateDiffDays(day0, today) === 1;
}

/**
 * Marca la cohorte día 0 (onboarding / primer ancla lite) una sola vez.
 * No PII: solo fecha local del ancla.
 */
export async function trackCohortDay0Once(
  userId: string,
  day: string = getLocalDateString(),
  source: string = 'onboarding',
): Promise<boolean> {
  try {
    await seedHoyLiteFirstDayIfUnset(userId, day);
    const key = cohortDay0TrackedKey(userId);
    if ((await AsyncStorage.getItem(key)) === '1') return false;
    await AsyncStorage.setItem(key, '1');
    void track('cohort_day0', { local_date: day, source });
    return true;
  } catch {
    return false;
  }
}

/**
 * Si hoy es exactamente el día después del ancla D0 y aún no se midió,
 * emite `returned_d1` una sola vez.
 */
export async function maybeTrackReturnedD1(
  userId: string,
  today: string = getLocalDateString(),
): Promise<boolean> {
  try {
    const trackedKey = returnedD1TrackedKey(userId);
    if ((await AsyncStorage.getItem(trackedKey)) === '1') return false;

    const day0 = await getHoyLiteFirstOpenDay(userId);
    if (!day0) return false;
    if (!shouldEmitReturnedD1(day0, today)) return false;

    await AsyncStorage.setItem(trackedKey, '1');
    void track('returned_d1', {
      day0,
      local_date: today,
      expected_d1: getNextLocalDateString(parseLocalDateString(day0)),
    });
    return true;
  } catch {
    return false;
  }
}
