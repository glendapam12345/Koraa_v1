import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type GoogleCalendarTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  email?: string;
};

const STORAGE_PREFIX = 'koraa.google_calendar.tokens';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

async function readItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function writeItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function loadGoogleCalendarTokens(
  userId: string,
): Promise<GoogleCalendarTokens | null> {
  if (!userId) return null;
  try {
    const raw = await readItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GoogleCalendarTokens;
    if (!parsed?.accessToken || typeof parsed.expiresAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveGoogleCalendarTokens(
  userId: string,
  tokens: GoogleCalendarTokens,
): Promise<void> {
  if (!userId) return;
  await writeItem(storageKey(userId), JSON.stringify(tokens));
}

export async function clearGoogleCalendarTokens(userId: string): Promise<void> {
  if (!userId) return;
  await deleteItem(storageKey(userId));
}
