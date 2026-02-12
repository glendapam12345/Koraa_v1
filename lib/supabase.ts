import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment variables or expo config.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tipo para errores de Supabase
interface SupabaseError {
  message?: string;
  code?: string;
}

// Helper para detectar errores de conexión
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

// Helper para obtener mensaje de error amigable
export const getErrorMessage = (error: unknown): string => {
  if (!error) return 'Ocurrió un error inesperado';
  
  if (isNetworkError(error)) {
    return 'Sin conexión a internet. Verifica tu conexión e intenta de nuevo.';
  }
  
  if (typeof error === 'object' && 'message' in error) {
    const err = error as SupabaseError;
    return err.message || 'Ocurrió un error inesperado. Por favor intenta de nuevo.';
  }
  
  return 'Ocurrió un error inesperado. Por favor intenta de nuevo.';
};
