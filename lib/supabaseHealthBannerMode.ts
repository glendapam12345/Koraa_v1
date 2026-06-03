import type { SupabaseHealthStatus } from '@/hooks/useSupabaseHealth';

/** Technical banner (migrations, .env, host mismatch) — solo desarrollo. */
export function isSupabaseHealthDevDetail(): boolean {
  return __DEV__;
}

/** En producción solo avisamos problemas que el usuario puede mitigar (red / sync). */
export function shouldShowSupabaseHealthBanner(status: SupabaseHealthStatus): boolean {
  if (status === 'idle' || status === 'checking' || status === 'ok') {
    return false;
  }
  if (__DEV__) {
    return true;
  }
  return status === 'unreachable' || status === 'schema_incomplete';
}
