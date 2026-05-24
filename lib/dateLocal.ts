/** Fecha calendario local en AAAA-MM-DD (sin desfase UTC). */
export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const da = String(date.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

/** Alias usado por reparto de carga y selectores de fecha. */
export const toISODateLocal = getLocalDateString;
