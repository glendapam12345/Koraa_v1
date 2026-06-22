import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { formatDurationLabel } from '@/lib/taskPlanningMeta';
import { buildPreviewTaskSummary } from '@/lib/review/previewTaskSummary';
import {
  applyCapturePriority,
  CAPTURE_PRIORITY_ORDER,
  clearCapturePriority,
  resolveCapturePriority,
  type CapturePriority,
} from '@/lib/review/capturePriority';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import type { AppLocale, TranslationKey } from '@/lib/i18n';

const PRIORITY_LABEL_KEYS: Record<CapturePriority, TranslationKey> = {
  low: 'vaciar.capturePriorityLow',
  medium: 'vaciar.capturePriorityMedium',
  high: 'vaciar.capturePriorityHigh',
  urgent: 'vaciar.capturePriorityUrgent',
};

type CaptureReviewSavePreviewProps = {
  items: EnrichedCaptureItem[];
  locale: AppLocale;
  onPressTask?: (taskId: string) => void;
  onChangeItem?: (item: EnrichedCaptureItem) => void;
};

export function CaptureReviewSavePreview({
  items,
  locale,
  onPressTask,
  onChangeItem,
}: CaptureReviewSavePreviewProps) {
  const { t } = useI18n();

  const totalMinutes = useMemo(
    () => items.reduce((sum, item) => sum + (item.estimatedMinutes ?? 0), 0),
    [items],
  );

  const tasksWithoutDuration = useMemo(
    () => items.filter((item) => !item.estimatedMinutes).length,
    [items],
  );

  if (items.length === 0) return null;

  const handlePriorityPress = (item: EnrichedCaptureItem, priority: CapturePriority) => {
    if (!onChangeItem) return;
    const active = resolveCapturePriority(item);
    if (active === priority) {
      if (priority === 'urgent') return;
      onChangeItem(clearCapturePriority(item));
      return;
    }
    onChangeItem(applyCapturePriority(item, priority));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Clock size={16} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.title}>{t('vaciar.areaReviewSaveSummaryTitle')}</Text>
      </View>

      <View style={styles.list}>
        {items.map((item) => {
          const durationLabel = item.estimatedMinutes
            ? formatDurationLabel(item.estimatedMinutes)
            : t('vaciar.areaReviewSaveSummaryNoDuration');
          const summary = buildPreviewTaskSummary(item, locale, t);
          const activePriority = resolveCapturePriority(item);

          return (
            <View key={item.id} style={styles.rowBlock}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => onPressTask?.(item.id)}
                disabled={!onPressTask}
                activeOpacity={onPressTask ? 0.85 : 1}
                accessibilityRole={onPressTask ? 'button' : 'text'}
                accessibilityLabel={t('vaciar.areaReviewSaveSummaryRowA11y', {
                  task: item.content.slice(0, 60),
                  duration: durationLabel,
                })}
              >
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {item.content}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {summary}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.rowDuration,
                    !item.estimatedMinutes && styles.rowDurationMissing,
                  ]}
                >
                  {durationLabel}
                </Text>
                {onPressTask ? (
                  <ChevronRight size={14} color={THEME.colors.text.tertiary} />
                ) : null}
              </TouchableOpacity>

              {onChangeItem ? (
                <View style={styles.priorityRow}>
                  {CAPTURE_PRIORITY_ORDER.map((priority) => {
                    const selected = activePriority === priority;
                    return (
                      <TouchableOpacity
                        key={priority}
                        style={[styles.priorityChip, selected && styles.priorityChipActive]}
                        onPress={() => handlePriorityPress(item, priority)}
                        activeOpacity={0.85}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={t(PRIORITY_LABEL_KEYS[priority])}
                      >
                        <Text
                          style={[
                            styles.priorityChipText,
                            selected && styles.priorityChipTextActive,
                          ]}
                        >
                          {t(PRIORITY_LABEL_KEYS[priority])}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{t('vaciar.areaReviewSaveSummaryTotal')}</Text>
        <Text style={styles.totalValue}>
          {totalMinutes > 0
            ? formatDurationLabel(totalMinutes)
            : t('vaciar.areaReviewSaveSummaryNoDuration')}
        </Text>
      </View>

      {tasksWithoutDuration > 0 ? (
        <Text style={styles.hint}>
          {t('vaciar.areaReviewSaveSummaryDurationHint', { count: tasksWithoutDuration })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
    alignSelf: 'stretch',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    alignSelf: 'stretch',
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  list: {
    gap: THEME.spacing.sm,
    alignSelf: 'stretch',
  },
  rowBlock: {
    gap: THEME.spacing.xs,
    paddingBottom: THEME.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.calm.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    alignSelf: 'stretch',
  },
  rowBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  rowTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 20,
  },
  rowMeta: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  rowDuration: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  rowDurationMissing: {
    color: THEME.colors.text.tertiary,
    fontFamily: THEME.fonts.heading.medium,
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingLeft: 2,
  },
  priorityChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
  },
  priorityChipActive: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  priorityChipText: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  priorityChipTextActive: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.calm.border,
  },
  totalLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  totalValue: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  hint: {
    ...THEME.typography.meta,
    color: THEME.colors.text.tertiary,
    lineHeight: 18,
  },
});
