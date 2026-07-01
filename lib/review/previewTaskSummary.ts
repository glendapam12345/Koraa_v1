import { formatProjectDueDate } from '@/lib/projectProgress';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import type { AppLocale, TranslationKey } from '@/lib/i18n';
import { formatPreferredTimeLabel } from '@/lib/taskPreferredTime';
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

export type PreviewTaskSummaryPart = {
  text: string;
  filled: boolean;
};

export function buildPreviewTaskSummaryParts(
  item: EnrichedCaptureItem,
  locale: AppLocale,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
): PreviewTaskSummaryPart[] {
  const parts: PreviewTaskSummaryPart[] = [];

  if (item.selectedDate) {
    const label = formatProjectDueDate(item.selectedDate, locale);
    parts.push({ text: label ?? item.selectedDate, filled: true });
  } else {
    parts.push({ text: t('vaciar.previewNoDate'), filled: false });
  }

  if (item.estimatedMinutes) {
    parts.push({
      text: t('vaciar.previewDurationMinutes', { count: item.estimatedMinutes }),
      filled: true,
    });
  } else {
    parts.push({ text: t('vaciar.previewNoDuration'), filled: false });
  }

  const whenLabel = formatPreferredTimeLabel(item.preferredTime, locale);
  if (whenLabel) {
    parts.push({ text: whenLabel, filled: true });
  } else {
    parts.push({ text: t('vaciar.previewNoWhen'), filled: false });
  }

  const priority = resolveCapturePriority(item);
  if (priority) {
    parts.push({ text: t(PRIORITY_LABEL_KEYS[priority]), filled: true });
  } else {
    parts.push({ text: t('vaciar.previewNoPriority'), filled: false });
  }

  return parts;
}

export function buildPreviewTaskSummary(
  item: EnrichedCaptureItem,
  locale: AppLocale,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
): string {
  return buildPreviewTaskSummaryParts(item, locale, t)
    .map((part) => part.text)
    .join(' · ');
}
