/**
 * URLs legales y contacto. Opcional: define en `.env`:
 * - EXPO_PUBLIC_PRIVACY_POLICY_URL
 * - EXPO_PUBLIC_TERMS_OF_SERVICE_URL
 */
export const SUPPORT_EMAIL = 'koraa.founder@yahoo.com.mx';

export function getPrivacyPolicyUrl(): string | null {
  const u = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim();
  return u || null;
}

export function getTermsOfServiceUrl(): string | null {
  const u = process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL?.trim();
  return u || null;
}

export function getSupportMailtoUrl(): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Ayuda con Koraa')}`;
}
