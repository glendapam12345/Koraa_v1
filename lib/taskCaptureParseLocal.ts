import type { AppLocale } from '@/lib/i18n';
import { getLocalDateString, toISODateLocal } from '@/lib/dateLocal';
import type { ParsedCaptureTask, TaskCaptureResult } from '@/lib/taskCaptureTypes';
import { inferEstimatedMinutesFromText } from '@/lib/inferTaskEstimatedMinutes';

const WEEKDAY_ES: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miércoles: 3,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sábado: 6,
  sabado: 6,
};

const WEEKDAY_EN: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function addDays(base: Date, days: number): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + days);
  return toISODateLocal(d);
}

function resolveWeekday(name: string, now: Date, locale: AppLocale): string | null {
  const map = locale === 'en' ? WEEKDAY_EN : WEEKDAY_ES;
  const target = map[name.toLowerCase()];
  if (target === undefined) return null;
  const current = now.getDay();
  let delta = (target - current + 7) % 7;
  if (delta === 0) delta = 0;
  return addDays(now, delta);
}

function extractDueDate(
  text: string,
  locale: AppLocale,
  now: Date = new Date(),
): { date: string | null; cleaned: string } {
  const lower = text.toLowerCase();
  const todayStr = getLocalDateString(now);

  if (/\b(hoy|today)\b/.test(lower)) {
    return {
      date: todayStr,
      cleaned: text.replace(/\b(hoy|today)\b/gi, '').replace(/\s+/g, ' ').trim(),
    };
  }

  if (/\b(pasado mañana|day after tomorrow)\b/.test(lower)) {
    return {
      date: addDays(now, 2),
      cleaned: text
        .replace(/\b(pasado mañana|day after tomorrow)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim(),
    };
  }

  if (/\b(mañana|tomorrow)\b/.test(lower)) {
    return {
      date: addDays(now, 1),
      cleaned: text.replace(/\b(mañana|tomorrow)\b/gi, '').replace(/\s+/g, ' ').trim(),
    };
  }

  const weekdayPattern =
    locale === 'en'
      ? /\b(?:on\s+)?(?:next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
      : /\b(?:el\s+|para\s+el\s+|este\s+)?(?:próximo\s+|proximo\s+)?(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b/i;

  const weekdayMatch = lower.match(weekdayPattern);
  if (weekdayMatch) {
    const date = resolveWeekday(weekdayMatch[1], now, locale);
    if (date) {
      return {
        date,
        cleaned: text.replace(weekdayMatch[0], '').replace(/\s+/g, ' ').trim(),
      };
    }
  }

  const isoMatch = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    return {
      date: isoMatch[1],
      cleaned: text.replace(isoMatch[0], '').replace(/\s+/g, ' ').trim(),
    };
  }

  const numericMatch = text.match(/\b(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](20\d{2}))?\b/);
  if (numericMatch) {
    const day = Number(numericMatch[1]);
    const month = Number(numericMatch[2]);
    const year = numericMatch[3] ? Number(numericMatch[3]) : now.getFullYear();
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const candidate = new Date(year, month - 1, day);
      if (
        candidate.getFullYear() === year &&
        candidate.getMonth() === month - 1 &&
        candidate.getDate() === day
      ) {
        return {
          date: toISODateLocal(candidate),
          cleaned: text.replace(numericMatch[0], '').replace(/\s+/g, ' ').trim(),
        };
      }
    }
  }

  const monthNames =
    locale === 'en'
      ? ([
          ['january', 'jan'],
          ['february', 'feb'],
          ['march', 'mar'],
          ['april', 'apr'],
          ['may', 'may'],
          ['june', 'jun'],
          ['july', 'jul'],
          ['august', 'aug'],
          ['september', 'sep', 'sept'],
          ['october', 'oct'],
          ['november', 'nov'],
          ['december', 'dec'],
        ] as const)
      : ([
          ['enero', 'ene'],
          ['febrero', 'feb'],
          ['marzo', 'mar'],
          ['abril', 'abr'],
          ['mayo', 'may'],
          ['junio', 'jun'],
          ['julio', 'jul'],
          ['agosto', 'ago'],
          ['septiembre', 'sep', 'sept'],
          ['octubre', 'oct'],
          ['noviembre', 'nov'],
          ['diciembre', 'dic'],
        ] as const);

  const monthAlt = monthNames.map((aliases) => aliases.join('|')).join('|');
  const dayMonthPattern =
    locale === 'en'
      ? new RegExp(`\\b(${monthAlt})\\s+(\\d{1,2})(?:(?:st|nd|rd|th)?(?:,)?\\s*(20\\d{2}))?\\b`, 'i')
      : new RegExp(`\\b(\\d{1,2})\\s+(?:de\\s+)?(${monthAlt})(?:\\s+(?:de\\s+)?(20\\d{2}))?\\b`, 'i');

  const dayMonthMatch = lower.match(dayMonthPattern);
  if (dayMonthMatch) {
    const monthToken = (locale === 'en' ? dayMonthMatch[1] : dayMonthMatch[2]).toLowerCase();
    const day = Number(locale === 'en' ? dayMonthMatch[2] : dayMonthMatch[1]);
    const year = Number(
      (locale === 'en' ? dayMonthMatch[3] : dayMonthMatch[3]) || now.getFullYear(),
    );
    const monthIndex = monthNames.findIndex((aliases) =>
      aliases.some((alias) => alias === monthToken),
    );
    if (monthIndex >= 0 && day >= 1 && day <= 31) {
      const candidate = new Date(year, monthIndex, day);
      if (
        candidate.getFullYear() === year &&
        candidate.getMonth() === monthIndex &&
        candidate.getDate() === day
      ) {
        return {
          date: toISODateLocal(candidate),
          cleaned: text.replace(dayMonthMatch[0], '').replace(/\s+/g, ' ').trim(),
        };
      }
    }
  }

  return { date: null, cleaned: text.trim() };
}

function inferEffort(text: string): ParsedCaptureTask['effort'] {
  const lower = text.toLowerCase();
  if (/\b(importante|urgente|crucial|heavy|important|urgent)\b/.test(lower)) return 'heavy';
  if (/\b(ligera|ligero|light|small|pequeñ)\b/.test(lower)) return 'light';
  return 'medium';
}

function cleanSegmentTitle(raw: string): string {
  return raw
    .replace(/^(tengo|necesito|debo|me falta|hay que)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[,.\-–:]+|[,.\-–:]+$/g, '')
    .trim();
}

function cleanTitle(raw: string): string {
  return raw
    .replace(
      /\b(tengo|necesito|debo|me falta|hay que|para|el|la|un|una|tarea|pendiente|importante)\b/gi,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[,.\-–:]+|[,.\-–:]+$/g, '')
    .trim();
}

function splitIntoSegments(text: string, locale: AppLocale): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const newlineParts = trimmed
    .split(/\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);
  if (newlineParts.length > 1) return newlineParts;

  const numberedParts = trimmed
    .split(/(?:^|\s)\d+[\.\)]\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);
  if (numberedParts.length > 1) return numberedParts;

  const listPattern =
    locale === 'en'
      ? /\s+and\s+|;\s*|\s*,\s+(?=[A-Za-z])/i
      : /\s+y\s+|;\s*|\s*,\s+(?=[A-Za-zÁÉÍÓÚáéíóúÑñ])/i;

  const listParts = trimmed
    .split(listPattern)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);
  if (listParts.length > 1) return listParts;

  return [trimmed];
}

function segmentToTask(
  segment: string,
  fallbackDate: string | null,
  fallbackEffort: ParsedCaptureTask['effort'],
  locale: AppLocale,
  now: Date,
): ParsedCaptureTask {
  const { date, cleaned } = extractDueDate(segment, locale, now);
  let content = cleanSegmentTitle(cleaned);
  if (!content || content.length < 3) {
    content = segment.trim().slice(0, 120);
  }
  return {
    content,
    scheduled_date: date ?? fallbackDate,
    effort: inferEffort(segment) ?? fallbackEffort,
    estimated_minutes: inferEstimatedMinutesFromText(
      content,
      (inferEffort(segment) ?? fallbackEffort) as 'light' | 'medium' | 'heavy' | null,
    ),
  };
}

function buildPrepSteps(
  title: string,
  dueDate: string,
  todayStr: string,
  locale: AppLocale,
): ParsedCaptureTask[] {
  if (dueDate <= todayStr) return [];

  const draftLabel = locale === 'en' ? `Draft: ${title}` : `Borrador: ${title}`;
  const reviewLabel = locale === 'en' ? `Review: ${title}` : `Revisar: ${title}`;

  const due = new Date(
    Number(dueDate.slice(0, 4)),
    Number(dueDate.slice(5, 7)) - 1,
    Number(dueDate.slice(8, 10)),
  );
  const today = new Date(
    Number(todayStr.slice(0, 4)),
    Number(todayStr.slice(5, 7)) - 1,
    Number(todayStr.slice(8, 10)),
  );
  const daysSpan = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSpan < 2) return [];

  const mid = addDays(today, Math.max(1, Math.floor(daysSpan / 2)));
  const beforeDue = addDays(due, -1);
  const reviewDate = beforeDue >= todayStr ? beforeDue : mid;

  return [
    { content: draftLabel, scheduled_date: mid, effort: 'medium' },
    { content: reviewLabel, scheduled_date: reviewDate, effort: 'light' },
  ];
}

function buildSummary(
  locale: AppLocale,
  taskCount: number,
  date: string | null,
  prepCount: number,
): string {
  if (locale === 'en') {
    if (taskCount > 1) {
      return date
        ? `Separated into ${taskCount} steps for ${date}.`
        : `Separated into ${taskCount} loose steps.`;
    }
    if (date && prepCount > 0) {
      return `Main step for ${date}, with ${prepCount} gentle prep steps.`;
    }
    if (date) return `One step for ${date}.`;
    return 'One loose step — add a date if it helps.';
  }

  if (taskCount > 1) {
    return date
      ? `Separado en ${taskCount} pasos para el ${date}.`
      : `Separado en ${taskCount} pasos sueltos.`;
  }
  if (date && prepCount > 0) {
    return `Paso principal para el ${date}, con ${prepCount} pasos suaves de preparación.`;
  }
  if (date) return `Un paso para el ${date}.`;
  return 'Un paso suelto — puedes añadir fecha si te ayuda.';
}

export function isUserListCapture(capture: TaskCaptureResult): boolean {
  if (capture.prep_steps.length === 0) return false;
  return !capture.prep_steps.some((step) =>
    /^(borrador|draft|revisar|review):/i.test(step.content.trim()),
  );
}

export function applyFormEffortToCapture(
  capture: TaskCaptureResult,
  effort: 'light' | 'medium' | 'heavy' | null,
): TaskCaptureResult {
  if (!effort) return capture;
  const withEffort = (task: ParsedCaptureTask): ParsedCaptureTask => ({
    ...task,
    effort: task.effort ?? effort,
  });
  return {
    ...capture,
    main_task: withEffort(capture.main_task),
    prep_steps: capture.prep_steps.map(withEffort),
  };
}

/** Cuenta pasos si el texto es una lista (comas / renglones), no prep steps automáticos. */
export function getMultiTaskListCount(rawInput: string, locale: AppLocale): number {
  const trimmed = rawInput.trim();
  if (!trimmed) return 0;
  const { cleaned } = extractDueDate(trimmed, locale);
  const segments = splitIntoSegments(cleaned, locale);
  return segments.length > 1 ? segments.length : 0;
}

export function isMultiTaskListInput(rawInput: string, locale: AppLocale): boolean {
  return getMultiTaskListCount(rawInput, locale) > 1;
}

/** Títulos detectados en vivo para vista previa mínima (solo listas). */
export function getCapturePreviewLines(rawInput: string, locale: AppLocale): string[] {
  const trimmed = rawInput.trim();
  if (!trimmed) return [];
  const { cleaned } = extractDueDate(trimmed, locale);
  const segments = splitIntoSegments(cleaned, locale);
  if (segments.length <= 1) return [];
  return segments
    .map((segment) => cleanTitle(segment) || segment.trim())
    .filter((line) => line.length >= 2)
    .slice(0, 12);
}

/** Aplica fecha del formulario a pasos sin fecha propia. */
export function applyFallbackDateToCapture(
  capture: TaskCaptureResult,
  fallbackDate: string | null,
): TaskCaptureResult {
  const withDate = (task: ParsedCaptureTask): ParsedCaptureTask => ({
    ...task,
    scheduled_date: task.scheduled_date ?? fallbackDate,
  });
  return {
    ...capture,
    main_task: withDate(capture.main_task),
    prep_steps: capture.prep_steps.map(withDate),
    fromAi: false,
  };
}

/**
 * Parser local (sin OpenAI): separa listas, extrae fechas y sugiere pasos de preparación.
 */
export function parseTaskCaptureLocally(
  rawInput: string,
  locale: AppLocale,
  now: Date = new Date(),
): TaskCaptureResult {
  const trimmed = rawInput.trim();
  const todayStr = getLocalDateString(now);
  const { date: globalDate, cleaned } = extractDueDate(trimmed, locale, now);
  const globalEffort = inferEffort(trimmed);
  const segments = splitIntoSegments(cleaned, locale);

  if (segments.length > 1) {
    const tasks = segments.map((segment) =>
      segmentToTask(segment, globalDate, globalEffort, locale, now),
    );
    const [main_task, ...prep_steps] = tasks;
    return {
      summary: buildSummary(locale, tasks.length, globalDate, 0),
      main_task,
      prep_steps,
      fromAi: false,
    };
  }

  let title = cleanTitle(cleaned);
  if (!title || title.length < 3) {
    title = trimmed.slice(0, 120);
  }

  const main_task: ParsedCaptureTask = {
    content: title,
    scheduled_date: globalDate,
    effort: globalEffort,
  };

  const prep_steps =
    globalDate && globalEffort === 'heavy'
      ? buildPrepSteps(title, globalDate, todayStr, locale)
      : [];

  return {
    summary: buildSummary(locale, 1, globalDate, prep_steps.length),
    main_task,
    prep_steps,
    fromAi: false,
  };
}
