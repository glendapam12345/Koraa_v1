import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Debug: Log para verificar de dónde vienen las credenciales
if (__DEV__) {
  console.log('🔍 Supabase Config Source:', {
    fromExpoConfig: !!Constants.expoConfig?.extra?.supabaseUrl,
    fromEnv: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
    url: supabaseUrl ? '✅ URL configurada' : '❌ URL faltante',
    key: supabaseAnonKey ? '✅ Key configurada' : '❌ Key faltante',
  });
}

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

// Códigos de error de esquema (columna o tabla faltante en Supabase)
const SCHEMA_ERROR_CODES = ['42703', 'PGRST204', 'PGRST205'];

/** Indica si el error es por esquema (tabla/columna faltante). */
export const isSchemaError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const err = error as SupabaseError & { code?: string };
  const code = err.code != null ? String(err.code) : '';
  const msg = (err.message || '').toLowerCase();
  return SCHEMA_ERROR_CODES.includes(code) || msg.includes('does not exist') || (msg.includes('column') && msg.includes('exist'));
};

export type SchemaSetupType = 'scheduled_date' | 'projects_table' | 'project_id' | 'schema';

/** Tipo de configuración faltante para errores de esquema (Semana / proyectos). */
export const getSchemaSetupMessage = (error: unknown): SchemaSetupType | null => {
  if (!isSchemaError(error)) return null;
  const err = error as SupabaseError & { message?: string };
  const msg = (err.message || '').toLowerCase();
  if (msg.includes('scheduled_date')) return 'scheduled_date';
  if (msg.includes("'projects'") || (msg.includes('projects') && msg.includes('table'))) return 'projects_table';
  if (msg.includes('project_id')) return 'project_id';
  return 'schema';
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
