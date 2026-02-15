/**
 * Comprueba si las variables de entorno de Supabase están disponibles.
 * No importa lib/supabase para evitar que falle si faltan.
 * Solo para diagnóstico en desarrollo.
 */
import Constants from 'expo-constants';

export function getSupabaseEnvStatus(): { url: boolean; key: boolean } {
  const url =
    !!Constants.expoConfig?.extra?.supabaseUrl ||
    !!(typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_URL);
  const key =
    !!Constants.expoConfig?.extra?.supabaseAnonKey ||
    !!(typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  return { url, key };
}
