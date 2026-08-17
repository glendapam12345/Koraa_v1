import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  pickAuthSessionStoredValue,
  shouldStoreAuthSessionInAsyncStorage,
} from '@/lib/authSessionStoragePolicy';

export {
  AUTH_SECURE_STORE_MAX_CHARS,
  pickAuthSessionStoredValue,
  shouldStoreAuthSessionInAsyncStorage,
} from '@/lib/authSessionStoragePolicy';

export const authSessionStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }

    let fromSecure: string | null = null;
    let fromAsync: string | null = null;
    try {
      fromSecure = await SecureStore.getItemAsync(key);
    } catch {
      fromSecure = null;
    }
    try {
      fromAsync = await AsyncStorage.getItem(key);
    } catch {
      fromAsync = null;
    }
    const picked = pickAuthSessionStoredValue(fromSecure, fromAsync);
    if (fromSecure && picked !== fromSecure) {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        /* ignore */
      }
    }
    return picked;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {
        /* ignore */
      }
      return;
    }

    if (shouldStoreAuthSessionInAsyncStorage(value)) {
      try {
        await AsyncStorage.setItem(key, value);
      } catch {
        /* ignore */
      }
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        /* ignore */
      }
      return;
    }

    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      /* ignore */
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
