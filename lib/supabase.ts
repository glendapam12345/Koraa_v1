import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { type AppLocale, translate } from '@/lib/i18n';
import { translateError } from '@/lib/errorMessages';

function trimEnv(s: string | undefined): string {
  return (s ?? '').trim();
}

const supabaseUrl =
  trimEnv(process.env.EXPO_PUBLIC_SUPABASE_URL) ||
  trimEnv(
    (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ||
      (Constants.manifest2 as { extra?: { supabaseUrl?: string } } | undefined)?.extra
        ?.supabaseUrl ||
      (Constants.manifest as { extra?: { supabaseUrl?: string } } | undefined)?.extra?.supabaseUrl,
  );
const supabaseAnonKey =
  trimEnv(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
  trimEnv(
    (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ||
      (Constants.manifest2 as { extra?: { supabaseAnonKey?: string } } | undefined)?.extra
        ?.supabaseAnonKey ||
      (Constants.manifest as { extra?: { supabaseAnonKey?: string } } | undefined)?.extra
        ?.supabaseAnonKey,
  );

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (__DEV__) {
  const host = supabaseUrl ? new URL(supabaseUrl).host : '—';
  console.log('🔍 Supabase:', {
    host,
    fromEnvUrl: !!trimEnv(process.env.EXPO_PUBLIC_SUPABASE_URL),
    fromExtraUrl: !!trimEnv(Constants.expoConfig?.extra?.supabaseUrl as string | undefined),
  });
}

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase no configurado. Define EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en .env o extra de Expo.',
  );
}

const resolvedUrl = supabaseUrl || 'https://placeholder.supabase.co';
const resolvedKey = supabaseAnonKey || 'placeholder-anon-key';

/** Web: localStorage. Native: SecureStore (fallback a AsyncStorage si falla lectura legacy). */
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    try {
      const v = await SecureStore.getItemAsync(key);
      if (v != null) return v;
    } catch {
      /* ignore */
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
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

export const supabase = createClient(resolvedUrl, resolvedKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    storageKey: 'koraa.supabase.auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Tipos de sesión/usuario inferidos del cliente (evita imports rotos de @supabase/supabase-js). */
export type SupabaseSession = Awaited<
  ReturnType<typeof supabase.auth.getSession>
>['data']['session'];
export type SupabaseUser = NonNullable<SupabaseSession>['user'];

/** Comprueba si el teléfono puede llegar a Supabase (misma red que el login). */
export async function canReachSupabase(): Promise<{ ok: boolean; detail?: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, detail: 'missing_config' };
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`${resolvedUrl}/auth/v1/health`, {
      method: 'GET',
      signal: ctrl.signal,
      headers: {
        apikey: resolvedKey,
        Authorization: `Bearer ${resolvedKey}`,
      },
    });
    clearTimeout(t);
    if (res.ok) return { ok: true, detail: String(res.status) };
    return { ok: res.status < 500, detail: `HTTP ${res.status}` };
  } catch (e) {
    clearTimeout(t);
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, detail: msg };
  }
}

interface SupabaseError {
  message?: string;
  code?: string;
}

export const isNetworkError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;

  const err = error as SupabaseError;
  const errorMessage = err.message?.toLowerCase() || '';
  const errorCode = typeof err.code === 'string' ? err.code.toLowerCase() : String(err.code || '').toLowerCase();

  return (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('offline') ||
    errorCode === 'network_error' ||
    errorCode === 'fetch_error'
  );
};

const SCHEMA_ERROR_CODES = ['42703', 'PGRST204', 'PGRST205'];

export const isSchemaError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const err = error as SupabaseError & { code?: string };
  const code = err.code != null ? String(err.code) : '';
  const msg = (err.message || '').toLowerCase();
  return SCHEMA_ERROR_CODES.includes(code) || msg.includes('does not exist') || (msg.includes('column') && msg.includes('exist'));
};

export type SchemaSetupType = 'scheduled_date' | 'projects_table' | 'project_id' | 'schema';

export const getSchemaSetupMessage = (error: unknown): SchemaSetupType | null => {
  if (!isSchemaError(error)) return null;
  const err = error as SupabaseError & { message?: string };
  const msg = (err.message || '').toLowerCase();
  if (msg.includes('scheduled_date')) return 'scheduled_date';
  if ((msg.includes('does not exist') || msg.includes('no existe')) && msg.includes('projects')) return 'projects_table';
  if (msg.includes('project_id')) return 'project_id';
  return 'schema';
};

export const getErrorMessage = (error: unknown, locale: AppLocale = 'es'): string => {
  if (!error) return translate(locale, 'supabaseErrors.unexpected');

  if (isNetworkError(error)) {
    return translate(locale, 'supabaseErrors.noConnection');
  }

  if (typeof error === 'object' && 'message' in error) {
    const err = error as SupabaseError;
    if (err.message) return translateError(err.message, locale);
  }

  if (error instanceof Error) {
    return translateError(error, locale);
  }

  return translate(locale, 'supabaseErrors.tryAgain');
};
