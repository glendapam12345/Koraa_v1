import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalDateString } from '@/lib/dateLocal';

const KEY_PREFIX = 'hoy_day_reflection_v1_';

function storageKey(userId: string, date: string = getLocalDateString()): string {
  return `${KEY_PREFIX}${userId}_${date}`;
}

export async function hasReflectedToday(
  userId: string,
  date: string = getLocalDateString(),
): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(storageKey(userId, date));
    return value === '1';
  } catch {
    return false;
  }
}

export async function markReflectedToday(
  userId: string,
  date: string = getLocalDateString(),
): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(userId, date), '1');
  } catch {
    // Non-critical preference
  }
}

export function isEveningReflectionWindow(now: Date = new Date()): boolean {
  return now.getHours() >= 17;
}
