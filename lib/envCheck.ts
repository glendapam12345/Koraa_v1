/**
 * Comprueba si las variables de entorno de Supabase están disponibles.
 * Usa la misma resolución que lib/supabase.ts (vía supabaseConfig).
 */
import { isSupabaseConfiguredFromConfig, resolveSupabaseConfig } from '@/lib/supabaseConfig';

export function getSupabaseEnvStatus(): { url: boolean; key: boolean; host: string } {
  const { url, anonKey, host } = resolveSupabaseConfig();
  return {
    url: Boolean(url),
    key: Boolean(anonKey),
    host,
  };
}

export function isSupabaseEnvReady(): boolean {
  return isSupabaseConfiguredFromConfig();
}
