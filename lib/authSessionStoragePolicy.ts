/** expo-secure-store warns/fails above 2048 bytes; Supabase session JWTs are larger. */
export const AUTH_SECURE_STORE_MAX_CHARS = 1800;

export function shouldStoreAuthSessionInAsyncStorage(value: string): boolean {
  return value.length > AUTH_SECURE_STORE_MAX_CHARS;
}

export function isCompleteAuthSessionValue(value: string | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return false;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return Boolean(parsed && typeof parsed === 'object');
  } catch {
    return false;
  }
}

/** Prefer the complete copy. A truncated SecureStore value must not win. */
export function pickAuthSessionStoredValue(
  fromSecure: string | null,
  fromAsync: string | null,
): string | null {
  const secureOk = isCompleteAuthSessionValue(fromSecure);
  const asyncOk = isCompleteAuthSessionValue(fromAsync);
  if (asyncOk && secureOk && fromAsync && fromSecure) {
    return fromAsync.length >= fromSecure.length ? fromAsync : fromSecure;
  }
  if (asyncOk) return fromAsync;
  if (secureOk) return fromSecure;
  return null;
}
