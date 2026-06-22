import { formatProjectDueDate } from '@/lib/projectProgress';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import type { AppLocale, TranslationKey } from '@/lib/i18n';
import {
  resolveCapturePriority,
  type CapturePriority,
} from '@/lib/review/capturePriority';

const PRIORITY_LABEL_KEYS: Record<CapturePriority, TranslationKey> = {
  low: 'vaciar.capturePriorityLow',
  medium: 'vaciar.capturePriorityMedium',
  high: 'vaciar.capturePriorityHigh',
  urgent: 'vaciar.capturePriorityUrgent',
};

export function buildPreviewTaskSummary(
  item: EnrichedCaptureItem,
  locale: AppLocale,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
): string {
  const parts: string[] = [];

  if (item.selectedDate) {
    const label = formatProjectDueDate(item.selectedDate, locale);
    parts.push(label ?? item.selectedDate);
  } else {
    parts.push(t('vaciar.previewNoDate'));
  }

  if (item.estimatedMinutes) {
    parts.push(t('vaciar.previewDurationMinutes', { count: item.estimatedMinutes }));
  }

  const priority = resolveCapturePriority(item);
  if (priority) {
    parts.push(t(PRIORITY_LABEL_KEYS[priority]));
  }

  return parts.join(' · ');
}
