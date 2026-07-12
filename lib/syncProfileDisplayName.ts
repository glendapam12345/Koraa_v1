import { supabase } from '@/lib/supabase';
import { fetchProfilePreferences } from '@/lib/profilePreferences';

/**
 * Si el nombre está en auth metadata (signup) pero no en profiles.full_name,
 * lo copia al perfil para saludos y Tu espacio.
 */
export async function syncProfileDisplayNameFromAuth(
  userId: string,
  userMetadata?: Record<string, unknown> | null,
): Promise<string | undefined> {
  const metaName =
    typeof userMetadata?.full_name === 'string' ? userMetadata.full_name.trim() : '';

  const { data } = await fetchProfilePreferences(userId);
  const profileName = data?.full_name?.trim();
  if (profileName) return profileName;
  if (!metaName) return undefined;

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: metaName })
    .eq('id', userId);

  if (error) return metaName;
  return metaName;
}
