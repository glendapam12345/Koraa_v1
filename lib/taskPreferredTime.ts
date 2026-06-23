import type { AppLocale } from '@/lib/i18n';

/** Hora preferida en formato 24h `HH:mm`. */
export type PreferredTimeValue = string;

const HHMM_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function isValidPreferredTime(value: string): boolean {
  return HHMM_RE.test(value.trim());
}

export function preferredTimeToDate(hhmm: string): Date {
  const match = hhmm.trim().match(HHMM_RE);
  const date = new Date();
  if (!match) {
    date.setHours(9, 0, 0, 0);
    return date;
  }
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
}

export function dateToPreferredTime(date: Date): PreferredTimeValue {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatPreferredTimeLabel(
  hhmm: string | null | undefined,
  locale: AppLocale,
): string | null {
  if (!hhmm?.trim() || !isValidPreferredTime(hhmm)) return null;
  const date = preferredTimeToDate(hhmm);
  return date.toLocaleTimeString(locale === 'en' ? 'en-US' : 'es-MX', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const PREFERRED_TIME_PRESETS: PreferredTimeValue[] = [
  '09:00',
  '12:00',
  '15:00',
  '18:00',
];
