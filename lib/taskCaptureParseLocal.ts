import type { AppLocale } from '@/lib/i18n';
import { getLocalDateString, toISODateLocal } from '@/lib/dateLocal';
import type { ParsedCaptureTask, TaskCaptureResult } from '@/lib/taskCaptureTypes';

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
      cleaned: text.replace(/\b(pasado mañana|day after tomorrow)\b/gi, '').replace(/\s+/g, ' ').trim(),
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

  return { date: null, cleaned: text.trim() };
}

function inferEffort(text: string): ParsedCaptureTask['effort'] {
  const lower = text.toLowerCase();
  if (/\b(importante|urgente|crucial|heavy|important|urgent)\b/.test(lower)) return 'heavy';
  if (/\b(ligera|ligero|light|small|pequeñ)\b/.test(lower)) return 'light';
  return 'medium';
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

function buildPrepSteps(
  title: string,
  dueDate: string,
  todayStr: string,
  locale: AppLocale,
): ParsedCaptureTask[] {
  if (dueDate <= todayStr) return [];

  const draftLabel =
    locale === 'en' ? `Draft: ${title}` : `Borrador: ${title}`;
  const reviewLabel =
    locale === 'en' ? `Review: ${title}` : `Revisar: ${title}`;

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

/**
 * Parser local (sin OpenAI): extrae fecha, título y pasos sugeridos de texto libre.
 */
export function parseTaskCaptureLocally(
  rawInput: string,
  locale: AppLocale,
  now: Date = new Date(),
): TaskCaptureResult {
  const trimmed = rawInput.trim();
  const todayStr = getLocalDateString(now);
  const { date, cleaned } = extractDueDate(trimmed, locale, now);
  const effort = inferEffort(trimmed);

  let title = cleanTitle(cleaned);
  if (!title || title.length < 3) {
    title = trimmed.slice(0, 120);
  }

  const main_task: ParsedCaptureTask = {
    content: title,
    scheduled_date: date,
    effort,
  };

  const prep_steps =
    date && effort === 'heavy' ? buildPrepSteps(title, date, todayStr, locale) : [];

  const summary =
    locale === 'en'
      ? date
        ? `Main step for ${date}${prep_steps.length ? `, with ${prep_steps.length} gentle prep steps` : ''}.`
        : 'One loose task — add a date if you like.'
      : date
        ? `Paso principal para el ${date}${prep_steps.length ? `, con ${prep_steps.length} pasos suaves de preparación` : ''}.`
        : 'Una tarea suelta — puedes añadir fecha si quieres.';

  return {
    summary,
    main_task,
    prep_steps,
    fromAi: false,
  };
}
