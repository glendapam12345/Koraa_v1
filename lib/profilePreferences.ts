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

export type SaveProfilePreferencesInput = {
  full_name: string | null;
  age?: number;
  favorite_activities: string[];
  interests: string[];
};

/**
 * Guarda preferencias de perfil. Usa upsert para crear la fila si no existe
 * (p. ej. usuarios anteriores al trigger de signup).
 */
export async function saveProfilePreferences(
  userId: string,
  email: string,
  payload: SaveProfilePreferencesInput,
): Promise<{
  error: { message: string; code?: string } | null;
  usedBasicFallback: boolean;
}> {
  const emailNorm = email.trim();

  const { data: existing, error: existingError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('id', userId)
    .maybeSingle();

  if (existingError) {
    return {
      error: { message: existingError.message, code: existingError.code },
      usedBasicFallback: false,
    };
  }

  const resolvedEmail = emailNorm || existing?.email?.trim() || '';

  if (!existing && !resolvedEmail) {
    return {
      error: { message: 'missing_email', code: 'missing_email' },
      usedBasicFallback: false,
    };
  }

  const saveExtended = async () => {
    if (existing) {
      return supabase
        .from('profiles')
        .update({
          full_name: payload.full_name,
          age: payload.age ?? null,
          favorite_activities: payload.favorite_activities,
          interests: payload.interests,
        })
        .eq('id', userId);
    }

    return supabase.from('profiles').insert({
      id: userId,
      email: resolvedEmail,
      full_name: payload.full_name,
      age: payload.age ?? null,
      favorite_activities: payload.favorite_activities,
      interests: payload.interests,
    });
  };

  const saveBasic = async () => {
    if (existing) {
      return supabase
        .from('profiles')
        .update({ full_name: payload.full_name })
        .eq('id', userId);
    }

    return supabase.from('profiles').insert({
      id: userId,
      email: resolvedEmail,
      full_name: payload.full_name,
    });
  };

  const extended = await saveExtended();

  if (!extended.error) {
    return { error: null, usedBasicFallback: false };
  }

  if (!isMissingColumnError(extended.error)) {
    return {
      error: { message: extended.error.message, code: extended.error.code },
      usedBasicFallback: false,
    };
  }

  const basic = await saveBasic();

  if (basic.error) {
    return {
      error: { message: basic.error.message, code: basic.error.code },
      usedBasicFallback: true,
    };
  }

  return { error: null, usedBasicFallback: true };
}
