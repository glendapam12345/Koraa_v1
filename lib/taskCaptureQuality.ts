import type { AppLocale } from '@/lib/i18n';
import type { TaskCaptureResult } from '@/lib/taskCaptureTypes';

function looksLikeMultipleTasks(text: string, locale: AppLocale): boolean {
  if (text.includes('\n')) return true;
  if (/[,;]/.test(text)) return true;
  if (locale === 'en') return /\band\b/i.test(text);
  return /\s+y\s+/i.test(text);
}

/** True when input seems like a list but output is still a single task. */
export function isWeakCaptureResult(
  rawInput: string,
  result: TaskCaptureResult,
  locale: AppLocale,
): boolean {
  const totalTasks = 1 + result.prep_steps.length;
  if (totalTasks > 1) return false;
  return looksLikeMultipleTasks(rawInput.trim(), locale);
}
