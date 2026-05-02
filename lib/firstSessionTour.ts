import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'koraa_first_session_tour_seen_v1_';

export function getFirstSessionTourStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export async function hasSeenFirstSessionTour(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(getFirstSessionTourStorageKey(userId))) === '1';
  } catch {
    return false;
  }
}

export async function markFirstSessionTourSeen(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(getFirstSessionTourStorageKey(userId), '1');
  } catch {
    /* no bloquear UI */
  }
}
