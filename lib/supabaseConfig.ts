import Constants from 'expo-constants';

function trimEnv(s: string | undefined): string {
  return (s ?? '').trim();
}

export type SupabaseConfigSource = 'env' | 'extra' | 'none';

export type ResolvedSupabaseConfig = {
  url: string;
  anonKey: string;
  source: SupabaseConfigSource;
  host: string;
};

function readExtraUrl(): string {
  return trimEnv(
    (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ||
      (Constants.manifest2 as { extra?: { supabaseUrl?: string } } | undefined)?.extra
        ?.supabaseUrl ||
      (Constants.manifest as { extra?: { supabaseUrl?: string } } | undefined)?.extra?.supabaseUrl,
  );
}

function readExtraKey(): string {
  return trimEnv(
    (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ||
      (Constants.manifest2 as { extra?: { supabaseAnonKey?: string } } | undefined)?.extra
        ?.supabaseAnonKey ||
      (Constants.manifest as { extra?: { supabaseAnonKey?: string } } | undefined)?.extra
        ?.supabaseAnonKey,
  );
}

/** Misma prioridad que Metro: .env (EXPO_PUBLIC_*) primero, luego extra de app.config. */
export function resolveSupabaseConfig(): ResolvedSupabaseConfig {
  const envUrl = trimEnv(process.env.EXPO_PUBLIC_SUPABASE_URL);
  const envKey = trimEnv(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  const extraUrl = readExtraUrl();
  const extraKey = readExtraKey();

  const url = envUrl || extraUrl;
  const anonKey = envKey || extraKey;
  let source: SupabaseConfigSource = 'none';
  if (url && anonKey) {
    source = envUrl && envKey ? 'env' : 'extra';
  }

  let host = '';
  try {
    host = url ? new URL(url).host : '';
  } catch {
    host = '';
  }

  return { url, anonKey, source, host };
}

export function isSupabaseConfiguredFromConfig(config: ResolvedSupabaseConfig = resolveSupabaseConfig()): boolean {
  return Boolean(config.url && config.anonKey);
}

/** En dev: avisa si .env y extra de Expo apuntan a proyectos distintos. */
export function getSupabaseConfigMismatch(): {
  mismatched: boolean;
  envHost: string;
  extraHost: string;
} | null {
  if (!__DEV__) return null;

  const envUrl = trimEnv(process.env.EXPO_PUBLIC_SUPABASE_URL);
  const extraUrl = readExtraUrl();
  if (!envUrl || !extraUrl) return null;

  try {
    const envHost = new URL(envUrl).host;
    const extraHost = new URL(extraUrl).host;
    if (envHost === extraHost) return null;
    return { mismatched: true, envHost, extraHost };
  } catch {
    return null;
  }
}
