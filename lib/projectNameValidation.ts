export type ValidateProjectNameResult =
  | { ok: true; name: string }
  | { ok: false; reason: 'empty' | 'too_short' | 'duplicate' };

export function validateProjectName(
  raw: string,
  existingNames: string[] = [],
): ValidateProjectNameResult {
  const name = raw.trim();
  if (!name) return { ok: false, reason: 'empty' };
  if (name.length < 2) return { ok: false, reason: 'too_short' };
  const duplicate = existingNames.some((n) => n.trim().toLowerCase() === name.toLowerCase());
  if (duplicate) return { ok: false, reason: 'duplicate' };
  return { ok: true, name };
}
