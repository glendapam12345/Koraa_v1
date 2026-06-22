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
import { buildPreviewTaskSummary } from '@/lib/review/previewTaskSummary';
import { TaskDurationStepper } from '@/components/vnext/TaskDurationStepper';
import { effortToDefaultMinutes } from '@/lib/taskPlanningMeta';

type ReviewPreviewTaskRowProps = {
  item: EnrichedCaptureItem;
  locale: AppLocale;
  compact?: boolean;
  hideTitle?: boolean;
  canMove?: boolean;
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
  onChange,
  onRequestMove,
  onDelete,
}: ReviewPreviewTaskRowProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(!compact);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  const activePriority = resolveCapturePriority(item);
  const urgentLocked = isUrgentCapturePriority(activePriority);

  const dateLabel = item.selectedDate
    ? formatProjectDueDate(item.selectedDate, locale)
    : null;

  const durationLabel = item.estimatedMinutes
    ? t('vaciar.previewDurationMinutes', { count: item.estimatedMinutes })
    : t('vaciar.previewTimeBtn');

  const priorityLabel = activePriority
    ? t(PRIORITY_LABEL_KEYS[activePriority])
    : t('vaciar.previewPriorityBtn');

  const summary = useMemo(
    () => buildPreviewTaskSummary(item, locale, t),
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
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={8}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={t('vaciar.previewDeleteTaskA11y')}
          >
            <Trash2 size={compact ? 14 : 16} color={THEME.colors.semantic.danger} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.hideTitleActions}>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={8}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={t('vaciar.previewDeleteTaskA11y')}
          >
            <Trash2 size={14} color={THEME.colors.semantic.danger} />
          </TouchableOpacity>
        </View>
      )}

      {showCollapsed ? (
        <TouchableOpacity
          style={styles.summaryRow}
          onPress={() => setExpanded(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('vaciar.previewAdjustTaskA11y', { summary })}
        >
          <Text style={styles.summaryText} numberOfLines={1}>
            {summary}
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
              style={[styles.actionBtn, showDatePicker && styles.actionBtnActive]}
              onPress={() => {
                setShowDatePicker((value) => !value);
                setShowDurationPicker(false);
                setShowPriorityPicker(false);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Calendar size={14} color={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.actionBtnText} numberOfLines={1}>
                {dateLabel ?? t('vaciar.previewDateBtn')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, showDurationPicker && styles.actionBtnActive]}
              onPress={() => {
                setShowDurationPicker((value) => !value);
                setShowDatePicker(false);
                setShowPriorityPicker(false);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Clock size={14} color={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.actionBtnText} numberOfLines={1}>
                {durationLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, showPriorityPicker && styles.actionBtnActive]}
              onPress={() => {
                setShowPriorityPicker((value) => !value);
                setShowDatePicker(false);
                setShowDurationPicker(false);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ expanded: showPriorityPicker }}
            >
              <Flag size={14} color={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.actionBtnText} numberOfLines={1}>
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
    color: THEME.colors.text.secondary,
    flex: 1,
    lineHeight: 16,
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
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: 40,
    maxWidth: '100%',
  },
  actionBtnActive: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  actionBtnText: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 16,
    flexShrink: 1,
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
