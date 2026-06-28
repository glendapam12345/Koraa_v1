import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalDateString } from '@/lib/dateLocal';

export type RecheckReplanNudge = {
  energyLevel: number;
};

const PREFIX = 'koraa_recheck_replan_nudge_v1';

function nudgeKey(userId: string): string {
  return `${PREFIX}_${userId}_${getLocalDateString()}`;
}

export async function saveRecheckReplanNudge(
  userId: string,
  energyLevel: number,
): Promise<void> {
  try {
    const payload: RecheckReplanNudge = { energyLevel };
    await AsyncStorage.setItem(nudgeKey(userId), JSON.stringify(payload));
  } catch {
    /* non-critical */
  }
}

export async function consumeRecheckReplanNudge(
  userId: string,
): Promise<RecheckReplanNudge | null> {
  try {
    const raw = await AsyncStorage.getItem(nudgeKey(userId));
    if (!raw) return null;
    await AsyncStorage.removeItem(nudgeKey(userId));
    const parsed = JSON.parse(raw) as RecheckReplanNudge;
    if (typeof parsed?.energyLevel !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function dismissRecheckReplanNudge(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(nudgeKey(userId));
  } catch {
    /* non-critical */
  }
}
