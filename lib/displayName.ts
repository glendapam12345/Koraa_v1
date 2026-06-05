type NameSource = {
  full_name?: string | null;
  user_metadata?: Record<string, unknown> | null;
  email?: string | null;
};

/** Nombre para saludos (perfil → metadata; nunca usa el correo). */
export function getDisplayName(
  source: NameSource | null | undefined,
  fallback: string,
): string {
  const fromProfile = source?.full_name?.trim();
  if (fromProfile) return fromProfile;

  const meta = source?.user_metadata?.full_name;
  if (typeof meta === 'string' && meta.trim()) return meta.trim();

  return fallback;
}

/** Primer nombre para saludos cortos (ej. "María" de "María García"). */
export function getFirstName(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return trimmed;
  return trimmed.split(/\s+/)[0] ?? trimmed;
}
