/** Fecha calendario local en AAAA-MM-DD (sin desfase UTC). */
export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const da = String(date.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

/** Parsea AAAA-MM-DD como medianoche local (evita desfase de `new Date('YYYY-MM-DD')`). */
export function parseLocalDateString(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map((part) => parseInt(part, 10));
  return new Date(y, m - 1, d);
}

/** Alias usado por reparto de carga y selectores de fecha. */
export const toISODateLocal = getLocalDateString;

/** Domingo de la semana calendario local (AAAA-MM-DD). */
export function getEndOfWeekLocalDateString(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysUntilSunday = (7 - d.getDay()) % 7;
  d.setDate(d.getDate() + daysUntilSunday);
  return getLocalDateString(d);
}

/**
 * Fecha calendario local (AAAA-MM-DD) a partir de un ISO guardado en BD (UTC o local).
 * No usar `iso.slice(0, 10)` — en zonas UTC− el día UTC puede ser distinto al día local.
 */
/** Normaliza `scheduled_date` de Supabase (date o timestamptz) a AAAA-MM-DD local. */
export function normalizeScheduledDate(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return getLocalDateFromISO(trimmed);
}

export function getLocalDateFromISO(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return iso;
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    const prefix = iso.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(prefix) ? prefix : getLocalDateString();
  }
  return getLocalDateString(parsed);
}

/** Día calendario local anterior (AAAA-MM-DD). */
export function getPreviousLocalDateString(date: Date = new Date()): string {
  const d = parseLocalDateString(getLocalDateString(date));
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

/** Día calendario local siguiente (AAAA-MM-DD). */
export function getNextLocalDateString(date: Date = new Date()): string {
  const d = parseLocalDateString(getLocalDateString(date));
  d.setDate(d.getDate() + 1);
  return getLocalDateString(d);
}
