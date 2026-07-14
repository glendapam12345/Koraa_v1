/**
 * URLs legales y contacto.
 * Por defecto: sitio público de Koraa (Lovable).
 * Opcional override en `.env`:
 * - EXPO_PUBLIC_PRIVACY_POLICY_URL
 * - EXPO_PUBLIC_TERMS_OF_SERVICE_URL
 */
export const SUPPORT_EMAIL = 'koraa.founder@yahoo.com.mx';

/** Política de privacidad publicada: https://koradelcaosalacalma.lovable.app/privacy */
export const DEFAULT_PRIVACY_POLICY_URL =
  'https://koradelcaosalacalma.lovable.app/privacy';

export const DEFAULT_TERMS_OF_SERVICE_URL =
  'https://koradelcaosalacalma.lovable.app/terms';

function resolvePublicUrl(envValue: string | undefined, fallback: string): string {
  const trimmed = envValue?.trim();
  return trimmed || fallback;
}

export function getPrivacyPolicyUrl(): string {
  return resolvePublicUrl(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL, DEFAULT_PRIVACY_POLICY_URL);
}

export function getTermsOfServiceUrl(): string {
  return resolvePublicUrl(process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL, DEFAULT_TERMS_OF_SERVICE_URL);
}

export function getSupportMailtoUrl(): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Ayuda con Koraa')}`;
}
