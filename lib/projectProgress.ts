/** Progreso y fechas de entrega de proyectos (client-side). */

export type ProjectProgress = {
  total: number;
  completed: number;
  incomplete: number;
  percent: number;
};

export function computeProjectProgress(total: number, incomplete: number): ProjectProgress {
  const safeTotal = Math.max(0, total);
  const safeIncomplete = Math.max(0, Math.min(incomplete, safeTotal));
  const completed = safeTotal - safeIncomplete;
  const percent =
    safeTotal === 0 ? 0 : Math.round((completed / safeTotal) * 100);

  return {
    total: safeTotal,
    completed,
    incomplete: safeIncomplete,
    percent,
  };
}

/** Formato corto para UI: 2026-06-20 → 20 jun 2026 (ES) / Jun 20, 2026 (EN). */
export function formatProjectDueDate(
  dueDate: string | null | undefined,
  locale: 'es' | 'en' = 'es',
): string | null {
  if (!dueDate?.trim()) return null;
  const parts = dueDate.trim().split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return dueDate;

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return dueDate;

  return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function daysUntilDue(dueDate: string | null | undefined): number | null {
  if (!dueDate?.trim()) return null;
  const parts = dueDate.trim().split('-').map(Number);
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  const due = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Normaliza entrada de usuario a YYYY-MM-DD o null si vacío/inválido. */
export function normalizeDueDateInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
