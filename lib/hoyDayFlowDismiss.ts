import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalDateString } from '@/lib/dateLocal';

function dismissKey(userId: string, date: string): string {
  return `koraa_hoy_day_flow_dismissed_v1_${userId}_${date}`;
}

/** Tarjeta «¿Cambió tu día?» — una vez por día calendario (local). */
export async function shouldShowDayChangedCard(
  userId: string,
  date: string = getLocalDateString(),
): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(dismissKey(userId, date))) !== '1';
  } catch {
    return true;
  }
}

export async function dismissDayChangedCard(
  userId: string,
  date: string = getLocalDateString(),
): Promise<void> {
  try {
    await AsyncStorage.setItem(dismissKey(userId, date), '1');
  } catch {
    /* no bloquear UI */
  }
}
