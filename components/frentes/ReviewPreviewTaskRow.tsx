import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import {
  Calendar,
  ArrowRightLeft,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  Flag,
  AlarmClock,
} from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { DateSelector } from '@/components/tasks/DateSelector';
import { formatProjectDueDate } from '@/lib/projectProgress';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import type { AppLocale, TranslationKey } from '@/lib/i18n';
import {
  applyCapturePriority,
  CAPTURE_PRIORITY_ORDER,
  clearCapturePriority,
  isUrgentCapturePriority,
  resolveCapturePriority,
  type CapturePriority,
} from '@/lib/review/capturePriority';
import { buildPreviewTaskSummary, buildPreviewTaskSummaryParts } from '@/lib/review/previewTaskSummary';
import { TaskDurationStepper } from '@/components/vnext/TaskDurationStepper';
import { TaskPreferredTimePicker } from '@/components/vnext/TaskPreferredTimePicker';
import { effortToDefaultMinutes } from '@/lib/taskPlanningMeta';
import { formatPreferredTimeLabel } from '@/lib/taskPreferredTime';

type ReviewPreviewTaskRowProps = {
  item: EnrichedCaptureItem;
  locale: AppLocale;
  compact?: boolean;
  hideTitle?: boolean;
  canMove?: boolean;
  hideDelete?: boolean;
  onChange: (item: EnrichedCaptureItem) => void;
  onRequestMove?: () => void;
  onDelete: () => void;
};

const PRIORITY_LABEL_KEYS: Record<CapturePriority, TranslationKey> = {
  low: 'vaciar.capturePriorityLow',
  medium: 'vaciar.capturePriorityMedium',
  high: 'vaciar.capturePriorityHigh',
  urgent: 'vaciar.capturePriorityUrgent',
};

export function ReviewPreviewTaskRow({
  item,
  locale,
  compact = true,
  hideTitle = false,
  canMove = false,
  hideDelete = false,
  onChange,
  onRequestMove,
  onDelete,
}: ReviewPreviewTaskRowProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(!compact);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showWhenPicker, setShowWhenPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  const activePriority = resolveCapturePriority(item);
  const urgentLocked = isUrgentCapturePriority(activePriority);

  const hasDate = Boolean(item.selectedDate);
  const hasDuration = Boolean(item.estimatedMinutes);
  const hasWhen = Boolean(item.preferredTime);
  const hasPriority = Boolean(activePriority);

  const dateLabel = hasDate
    ? formatProjectDueDate(item.selectedDate!, locale)
    : t('vaciar.previewDateBtn');

  const durationLabel = hasDuration
    ? t('vaciar.previewDurationMinutes', { count: item.estimatedMinutes! })
    : t('vaciar.previewDurationBtn');

  const whenLabel = hasWhen
    ? (formatPreferredTimeLabel(item.preferredTime, locale) ?? t('vaciar.previewWhenBtn'))
    : t('vaciar.previewWhenBtn');

  const priorityLabel = hasPriority
    ? t(PRIORITY_LABEL_KEYS[activePriority!])
    : t('vaciar.previewPriorityBtn');

  const summaryParts = useMemo(
    () => buildPreviewTaskSummaryParts(item, locale, t),
    [item, locale, t],
  );

  const showCollapsed = compact && !expanded;

  const handlePriorityPress = (priority: CapturePriority) => {
    if (activePriority === priority) {
      if (priority === 'urgent') return;
      onChange(clearCapturePriority(item));
      return;
    }
    onChange(applyCapturePriority(item, priority));
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {!hideTitle ? (
        <View style={styles.mainRow}>
          <TextInput
            style={[styles.input, compact && styles.inputCompact]}
            value={item.content}
            onChangeText={(text) => onChange({ ...item, content: text })}
            multiline={!compact}
            maxLength={300}
            placeholderTextColor={THEME.colors.text.tertiary}
            accessibilityLabel={t('vaciar.previewEditTaskA11y', { task: item.content.slice(0, 40) })}
          />
          {!hideDelete ? (
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={8}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel={t('vaciar.previewDeleteTaskA11y')}
            >
              <Trash2 size={compact ? 14 : 16} color={THEME.colors.semantic.danger} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <View style={styles.hideTitleActions}>
          {!hideDelete ? (
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={8}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel={t('vaciar.previewDeleteTaskA11y')}
            >
              <Trash2 size={14} color={THEME.colors.semantic.danger} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {showCollapsed ? (
        <TouchableOpacity
          style={styles.summaryRow}
          onPress={() => setExpanded(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('vaciar.previewAdjustTaskA11y', {
            summary: buildPreviewTaskSummary(item, locale, t),
          })}
        >
          <Text style={styles.summaryText} numberOfLines={2}>
            {summaryParts.map((part, index) => (
              <Text
                key={`${part.text}-${index}`}
                style={part.filled ? styles.summaryFilled : styles.summaryMissing}
              >
                {index > 0 ? ' · ' : ''}
                {part.text}
              </Text>
            ))}
          </Text>
          <View style={styles.adjustBtn}>
            <Text style={styles.adjustText}>{t('vaciar.previewAdjustTask')}</Text>
            <ChevronDown size={14} color={THEME.colors.calm.lavenderDeep} />
          </View>
        </TouchableOpacity>
      ) : (
        <>
          {compact ? (
            <TouchableOpacity
              style={styles.collapseBtn}
              onPress={() => {
                setExpanded(false);
                setShowDatePicker(false);
                setShowDurationPicker(false);
                setShowWhenPicker(false);
                setShowPriorityPicker(false);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('vaciar.previewCollapseTaskA11y')}
            >
              <Text style={styles.adjustText}>{t('vaciar.previewCollapseTask')}</Text>
              <ChevronUp size={14} color={THEME.colors.calm.lavenderDeep} />
            </TouchableOpacity>
          ) : null}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                hasDate ? styles.actionBtnFilled : styles.actionBtnEmpty,
                showDatePicker && styles.actionBtnActive,
              ]}
              onPress={() => {
                setShowDatePicker((value) => !value);
                setShowDurationPicker(false);
                setShowWhenPicker(false);
                setShowPriorityPicker(false);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: hasDate }}
            >
              <Calendar
                size={14}
                color={hasDate ? THEME.colors.calm.lavenderDeep : THEME.colors.text.tertiary}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  !hasDate && styles.actionBtnTextEmpty,
                ]}
                numberOfLines={1}
              >
                {dateLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                hasDuration ? styles.actionBtnFilled : styles.actionBtnEmpty,
                showDurationPicker && styles.actionBtnActive,
              ]}
              onPress={() => {
                setShowDurationPicker((value) => !value);
                setShowDatePicker(false);
                setShowWhenPicker(false);
                setShowPriorityPicker(false);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: hasDuration }}
            >
              <Clock
                size={14}
                color={hasDuration ? THEME.colors.calm.lavenderDeep : THEME.colors.text.tertiary}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  !hasDuration && styles.actionBtnTextEmpty,
                ]}
                numberOfLines={1}
              >
                {durationLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                hasWhen ? styles.actionBtnFilled : styles.actionBtnEmpty,
                showWhenPicker && styles.actionBtnActive,
              ]}
              onPress={() => {
                setShowWhenPicker((value) => !value);
                setShowDatePicker(false);
                setShowDurationPicker(false);
                setShowPriorityPicker(false);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: hasWhen }}
            >
              <AlarmClock
                size={14}
                color={hasWhen ? THEME.colors.calm.lavenderDeep : THEME.colors.text.tertiary}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  !hasWhen && styles.actionBtnTextEmpty,
                ]}
                numberOfLines={1}
              >
                {whenLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                hasPriority ? styles.actionBtnFilled : styles.actionBtnEmpty,
                showPriorityPicker && styles.actionBtnActive,
              ]}
              onPress={() => {
                setShowPriorityPicker((value) => !value);
                setShowDatePicker(false);
                setShowDurationPicker(false);
                setShowWhenPicker(false);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ expanded: showPriorityPicker, selected: hasPriority }}
            >
              <Flag
                size={14}
                color={hasPriority ? THEME.colors.calm.lavenderDeep : THEME.colors.text.tertiary}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  !hasPriority && styles.actionBtnTextEmpty,
                ]}
                numberOfLines={1}
              >
                {priorityLabel}
              </Text>
            </TouchableOpacity>

            {canMove && onRequestMove ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={onRequestMove}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('vaciar.previewMoveTaskA11y')}
              >
                <ArrowRightLeft size={14} color={THEME.colors.calm.lavenderDeep} />
                <Text style={styles.actionBtnText}>{t('vaciar.previewMoveTask')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {showDatePicker ? (
            <View style={styles.pickerWrap}>
              <DateSelector
                compact
                hideLabel
                selectedDate={item.selectedDate}
                onSelect={(date) => {
                  onChange({
                    ...item,
                    selectedDate: date,
                    timing: date ? 'this_week' : 'later',
                  });
                  if (date) setShowDatePicker(false);
                }}
              />
            </View>
          ) : null}

          {showDurationPicker ? (
            <View style={styles.pickerWrap}>
              <TaskDurationStepper
                minutes={item.estimatedMinutes ?? effortToDefaultMinutes(item.effortFeel ?? undefined)}
                onChange={(minutes) =>
                  onChange({
                    ...item,
                    estimatedMinutes: minutes,
                    effortFeel:
                      minutes <= 25 ? 'light' : minutes >= 75 ? 'heavy' : 'medium',
                  })
                }
              />
              {item.estimatedMinutes ? (
                <TouchableOpacity
                  style={styles.clearDurationBtn}
                  onPress={() => onChange({ ...item, estimatedMinutes: null })}
                  accessibilityRole="button"
                  accessibilityLabel={t('vaciar.areaReviewClearDurationA11y')}
                >
                  <Text style={styles.clearDurationText}>
                    {t('vaciar.areaReviewClearDuration')}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {showWhenPicker ? (
            <View style={styles.pickerWrap}>
              <TaskPreferredTimePicker
                value={item.preferredTime}
                onChange={(preferredTime) => onChange({ ...item, preferredTime })}
                compact
              />
            </View>
          ) : null}

          {showPriorityPicker ? (
            <View style={styles.pickerWrap}>
              <View style={styles.optionRow}>
                {CAPTURE_PRIORITY_ORDER.map((priority) => {
                  const active = activePriority === priority;
                  const disabled = urgentLocked && priority !== 'urgent';
                  return (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.optionChip,
                        active && styles.optionChipActive,
                        priority === 'urgent' && active && styles.optionChipUrgent,
                        disabled && styles.optionChipDisabled,
                      ]}
                      onPress={() => handlePriorityPress(priority)}
                      disabled={disabled}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active, disabled }}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          active && styles.optionChipTextActive,
                          priority === 'urgent' && active && styles.optionChipTextUrgent,
                        ]}
                      >
                        {t(PRIORITY_LABEL_KEYS[priority])}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {urgentLocked ? (
                <Text style={styles.urgentHint}>{t('vaciar.capturePriorityUrgentHint')}</Text>
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
    alignSelf: 'stretch',
  },
  wrapCompact: {
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.xs,
  },
  hideTitleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 20,
    paddingVertical: 2,
    minHeight: 24,
    textAlignVertical: 'top',
  },
  inputCompact: {
    ...THEME.typography.caption,
    lineHeight: 18,
    minHeight: 20,
  },
  iconBtn: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.borderRadius.standard,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  summaryText: {
    ...THEME.typography.small,
    flex: 1,
    lineHeight: 16,
  },
  summaryFilled: {
    color: THEME.colors.text.secondary,
  },
  summaryMissing: {
    color: THEME.colors.text.tertiary,
    fontStyle: 'italic',
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  adjustText: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 14,
  },
  collapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 2,
    paddingVertical: 2,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    alignSelf: 'stretch',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    minHeight: 40,
    maxWidth: '100%',
  },
  actionBtnFilled: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
    borderStyle: 'solid',
  },
  actionBtnEmpty: {
    backgroundColor: THEME.colors.fill[100],
    borderColor: THEME.colors.calm.border,
    borderStyle: 'dashed',
  },
  actionBtnActive: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
    borderStyle: 'solid',
  },
  actionBtnText: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 16,
    flexShrink: 1,
  },
  actionBtnTextEmpty: {
    color: THEME.colors.text.tertiary,
    fontFamily: THEME.fonts.heading.medium,
  },
  pickerWrap: {
    paddingTop: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.xs,
    paddingBottom: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    alignSelf: 'stretch',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    alignSelf: 'stretch',
  },
  optionChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: 34,
    justifyContent: 'center',
  },
  optionChipActive: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  optionChipUrgent: {
    backgroundColor: THEME.colors.semantic.warnSoft ?? THEME.colors.calm.lavender,
    borderColor: THEME.colors.semantic.warn,
  },
  optionChipDisabled: {
    opacity: 0.45,
  },
  optionChipText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 14,
  },
  optionChipTextActive: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  optionChipTextUrgent: {
    color: THEME.colors.semantic.warn,
  },
  urgentHint: {
    ...THEME.typography.small,
    color: THEME.colors.semantic.warn,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  clearDurationBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  clearDurationText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
});
