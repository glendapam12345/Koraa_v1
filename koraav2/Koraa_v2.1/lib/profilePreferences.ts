import { supabase } from '@/lib/supabase';

/** Preferencias extendidas en `profiles` (requieren migración en Supabase si no existen). */
export type ProfilePreferencesData = {
  full_name?: string | null;
  age?: number | null;
  favorite_activities: string[];
  interests: string[];
  other_preferences: Record<string, unknown>;
};

function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === '42703' ||
    (typeof error.message === 'string' && error.message.includes('does not exist'))
  );
}

/**
 * Carga columnas de personalización del perfil.
 * Si la BD no tiene aún `age`, etc., devuelve valores por defecto sin error (Postgres 42703).
 */
export async function fetchProfilePreferences(userId: string): Promise<{
  data: ProfilePreferencesData | null;
  error: { message: string; code?: string } | null;
  extendedColumnsAvailable: boolean;
}> {
  const extended = await supabase
    .from('profiles')
    .select('full_name, age, favorite_activities, interests, other_preferences')
    .eq('id', userId)
    .maybeSingle();

  if (extended.error && isMissingColumnError(extended.error)) {
    const { data: row, error: basicError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (basicError) {
      return {
        data: null,
        error: { message: basicError.message, code: basicError.code },
        extendedColumnsAvailable: false,
      };
    }
    if (!row) {
      return { data: null, error: null, extendedColumnsAvailable: false };
    }

    return {
      data: {
        full_name: row?.full_name ?? undefined,
        age: undefined,
        favorite_activities: [],
        interests: [],
        other_preferences: {},
      },
      error: null,
      extendedColumnsAvailable: false,
    };
  }

  if (extended.error) {
    return {
      data: null,
      error: { message: extended.error.message, code: extended.error.code },
      extendedColumnsAvailable: true,
    };
  }

  if (!extended.data) {
    return { data: null, error: null, extendedColumnsAvailable: true };
  }

  const d = extended.data;
  return {
    data: {
      full_name: d.full_name ?? undefined,
      age: d.age ?? undefined,
      favorite_activities: d.favorite_activities ?? [],
      interests: d.interests ?? [],
      other_preferences: (d.other_preferences as Record<string, unknown>) ?? {},
    },
    error: null,
    extendedColumnsAvailable: true,
  };
}
