import type { AppLocale } from '@/lib/i18n';

export function speechRecognitionLocale(locale: AppLocale): string {
  return locale === 'en' ? 'en-US' : 'es-MX';
}
