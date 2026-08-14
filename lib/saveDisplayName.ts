import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { normalizeDisplayName } from '@/lib/displayName';

export { normalizeDisplayName };

/**
 * Guarda el nombre en `profiles.full_name` y en auth metadata
 * (saludos en Hoy / Para mí / Yo). No toca actividades ni intereses.
 */
export async function saveUserDisplayName(
  userId: string,
  email: string | undefined,
  rawName: string,
): Promise<{ name: string | null; error: string | null }> {
  const name = normalizeDisplayName(rawName);
  if (!name) {
    return { name: null, error: 'invalid_name' };
  }

  const { data: existing, error: existingError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('id', userId)
    .maybeSingle();

  if (existingError) {
    logger.error('Error leyendo perfil para nombre:', existingError);
    return { name: null, error: existingError.message };
  }

  const resolvedEmail = email?.trim() || existing?.email?.trim() || '';

  if (existing) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: name })
      .eq('id', userId);
    if (updateError) {
      logger.error('Error guardando nombre de perfil:', updateError);
      return { name: null, error: updateError.message };
    }
  } else {
    if (!resolvedEmail) {
      return { name: null, error: 'missing_email' };
    }
    const { error: insertError } = await supabase.from('profiles').insert({
      id: userId,
      email: resolvedEmail,
      full_name: name,
    });
    if (insertError) {
      logger.error('Error creando perfil con nombre:', insertError);
      return { name: null, error: insertError.message };
    }
  }

  const { error: metaErr } = await supabase.auth.updateUser({
    data: { full_name: name },
  });
  if (metaErr) {
    logger.warn('Nombre en perfil; no se pudo sincronizar metadata:', metaErr);
  }

  return { name, error: null };
}
