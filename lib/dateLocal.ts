/** Fecha calendario local en AAAA-MM-DD (sin desfase UTC). */
export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const da = String(date.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

/**
 * Fecha calendario desde un `Date` del DateTimePicker nativo.
 * iOS a menudo entrega medianoche UTC del día tocado; con getDate() local
 * (p. ej. México UTC−) eso baja un día. Si el instante es exactamente
 * medianoche UTC, usamos componentes UTC; si no, componentes locales.
 */
export function calendarDateStringFromPicker(date: Date): string {
  const utcMidnight =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;

  if (utcMidnight) {
    const y = date.getUTCFullYear();
    const mo = String(date.getUTCMonth() + 1).padStart(2, '0');
    const da = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  }

  return getLocalDateString(date);
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

const SHORT_MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
const SHORT_MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

type CompactDateRelative = {
  today: string;
  tomorrow: string;
};

/**
 * Fecha corta para chips: `29 ago` / `29 Aug`.
 * Sin año si es el actual (evita recortes tipo “Aug 29, 2…”).
 */
export function formatCompactDateLabel(
  dateStr: string,
  locale: 'es' | 'en' = 'es',
  relative?: CompactDateRelative,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;

  if (relative) {
    const todayStr = getLocalDateString();
    if (dateStr === todayStr) return relative.today;
    if (dateStr === getNextLocalDateString()) return relative.tomorrow;
  }

  const year = Number(dateStr.slice(0, 4));
  const month = Number(dateStr.slice(5, 7));
  const day = Number(dateStr.slice(8, 10));
  const months = locale === 'en' ? SHORT_MONTHS_EN : SHORT_MONTHS_ES;
  const monthName = months[month - 1];
  if (!monthName || day < 1 || day > 31) return null;

  const label = `${day} ${monthName}`;
  return year !== new Date().getFullYear() ? `${label} ${year}` : label;
}
