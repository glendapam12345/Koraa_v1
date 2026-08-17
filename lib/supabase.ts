import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { type AppLocale, translate } from '@/lib/i18n';
import { translateError } from '@/lib/errorMessages';
import {
  getSupabaseConfigMismatch,
  isSupabaseConfiguredFromConfig,
  resolveSupabaseConfig,
} from '@/lib/supabaseConfig';
import { peekCachedAuthUser, setCachedAuthUser } from '@/lib/cachedAuthUser';
import { authSessionStorage } from '@/lib/authSessionStorage';

export { setCachedAuthUser, resetCachedAuthUser } from '@/lib/cachedAuthUser';

const { url: supabaseUrl, anonKey: supabaseAnonKey, source: configSource, host: configHost } =
  resolveSupabaseConfig();

export const isSupabaseConfigured = isSupabaseConfiguredFromConfig({
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  source: configSource,
  host: configHost,
});

export { getSupabaseConfigMismatch } from '@/lib/supabaseConfig';

if (__DEV__) {
  const mismatch = getSupabaseConfigMismatch();
  console.log('🔍 Supabase:', {
    host: configHost || '—',
    source: configSource,
    fromEnv: !!process.env.EXPO_PUBLIC_SUPABASE_URL?.trim(),
  });
  if (mismatch?.mismatched) {
    console.warn(
      `[Koraa] EXPO_PUBLIC_SUPABASE_URL (.env → ${mismatch.envHost}) no coincide con extra en app.config (${mismatch.extraHost}). ` +
        'La app usa .env primero. Reinicia Metro con: npm run dev:clear',
    );
  }
}

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase no configurado. Define EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en .env o extra de Expo.',
  );
}

const resolvedUrl = supabaseUrl || 'https://placeholder.supabase.co';
const resolvedKey = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(resolvedUrl, resolvedKey, {
  auth: {
    storage: authSessionStorage,
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

/**
 * Usuario de la sesión local (sin round-trip al Auth server).
 * `getUser()` valida en red y congela la UI en Expo Go / RN.
 * Prefers the in-memory user from AuthContext so saves skip SecureStore.
 */
export async function getCachedAuthUser(): Promise<SupabaseUser | null> {
  const memoryUser = peekCachedAuthUser();
  if (memoryUser !== undefined) {
    return memoryUser as SupabaseUser;
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  setCachedAuthUser(user);
  return user;
}

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
  if (msg.includes('parent_task_id')) return 'schema';
  if (msg.includes('scheduled_date')) return 'scheduled_date';
  if ((msg.includes('does not exist') || msg.includes('no existe')) && msg.includes('projects')) {
    return 'projects_table';
  }
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
