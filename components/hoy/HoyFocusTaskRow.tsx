import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { Check, ChevronRight, Star } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyFocusTaskRowProps = {
  content: string;
  completed: boolean;
  index: number;
  /** Soft secondary line (time / duration) — optional, calm density. */
  durationLabel?: string | null;
  preferredTimeLabel?: string | null;
  deadlineLabel?: string | null;
  deadlineUrgent?: boolean;
  projectId?: string | null;
  projectName?: string | null;
  projectColor?: string;
  projectPercent?: number | null;
  areaLabel?: string | null;
  isPriority?: boolean;
  isLast?: boolean;
  onToggleComplete: () => void;
  onOpenDetails: () => void;
  onDelete?: () => void;
  onPostpone?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
};

/**
 * Fila calm del plan de Hoy: check + título + meta (proyecto, fecha, paso sugerido).
 */
export function HoyFocusTaskRow({
  content,
  completed,
  preferredTimeLabel,
  durationLabel,
  deadlineLabel,
  deadlineUrgent = false,
  projectName,
  projectColor,
  isPriority = false,
  isLast = false,
  onToggleComplete,
  onOpenDetails,
}: HoyFocusTaskRowProps) {
  const { t } = useI18n();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!completed) return;
    pulse.setValue(1);
    Animated.sequence([
      Animated.spring(pulse, {
        toValue: 1.02,
        useNativeDriver: true,
        speed: 28,
        bounciness: 8,
      }),
      Animated.spring(pulse, {
        toValue: 1,
        useNativeDriver: true,
        speed: 24,
        bounciness: 4,
      }),
    ]).start();
  }, [completed, pulse]);

  const timeMeta =
    preferredTimeLabel && durationLabel
      ? `${preferredTimeLabel} · ${durationLabel}`
      : preferredTimeLabel || durationLabel || null;

  const accentColor = projectColor || THEME.colors.gradient.blue;
  const showMeta = !completed && (isPriority || projectName || deadlineLabel || timeMeta);

  return (
    <Animated.View
      style={[
        styles.row,
        completed && styles.rowCompleted,
        isLast && styles.rowLast,
        { transform: [{ scale: pulse }] },
      ]}
    >
      <TouchableOpacity
        onPress={onToggleComplete}
        delayPressIn={0}
        activeOpacity={0.85}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={t('hoy.focusTaskToggleA11y', { task: content })}
        style={styles.checkTouch}
      >
        {completed ? (
          <View style={styles.checkDone}>
            <Check size={14} color={THEME.colors.onGradient} strokeWidth={3} />
          </View>
        ) : (
          <View style={styles.checkRing} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.body}
        onPress={onOpenDetails}
        delayPressIn={0}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={t('hoy.focusTaskOpenA11y', { task: content })}
        accessibilityHint={t('hoy.focusTaskOpenHint')}
      >
        <Text style={[styles.content, completed && styles.contentDone]} numberOfLines={2}>
          {content}
        </Text>
        {showMeta ? (
          <View style={styles.metaRow}>
            {isPriority ? (
              <View style={styles.chipPriority}>
                <Star
                  size={10}
                  color={THEME.colors.calm.lavenderDeep}
                  fill={THEME.colors.calm.lavenderDeep}
                />
                <Text style={styles.chipPriorityText}>{t('hoy.focusTaskSuggestedBadge')}</Text>
              </View>
            ) : null}
            {projectName ? (
              <View style={styles.chipProject}>
                <View style={[styles.projectDot, { backgroundColor: accentColor }]} />
                <Text style={[styles.chipProjectText, { color: accentColor }]} numberOfLines={1}>
                  {projectName}
                </Text>
              </View>
            ) : null}
            {deadlineLabel ? (
              <View style={[styles.chipDeadline, deadlineUrgent && styles.chipDeadlineUrgent]}>
                <Text
                  style={[
                    styles.chipDeadlineText,
                    deadlineUrgent && styles.chipDeadlineTextUrgent,
                  ]}
                  numberOfLines={1}
                >
                  {deadlineLabel}
                </Text>
              </View>
            ) : null}
            {timeMeta ? (
              <Text style={styles.timeMeta} numberOfLines={1}>
                {timeMeta}
              </Text>
            ) : null}
          </View>
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onOpenDetails}
        delayPressIn={0}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.75}
        style={styles.chevronBtn}
        accessibilityRole="button"
        accessibilityLabel={t('hoy.focusTaskEditA11y', { task: content })}
        accessibilityHint={t('hoy.focusTaskOpenHint')}
      >
        <ChevronRight size={18} color={THEME.colors.text.tertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
  },
  rowCompleted: {
    opacity: 0.6,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  checkTouch: {
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
    marginTop: 2,
  },
  checkRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
  },
  checkDone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    borderWidth: 2,
    borderColor: THEME.colors.calm.lavenderDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    paddingVertical: 2,
  },
  content: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 24,
    fontSize: 17,
  },
  contentDone: {
    color: THEME.colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  chipPriority: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavender,
  },
  chipPriorityText: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 16,
  },
  chipProject: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '70%',
  },
  projectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipProjectText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 16,
    flexShrink: 1,
  },
  chipDeadline: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
  },
  chipDeadlineUrgent: {
    backgroundColor: THEME.colors.calm.blush,
  },
  chipDeadlineText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  chipDeadlineTextUrgent: {
    color: THEME.colors.gradient.pink,
    fontFamily: THEME.fonts.heading.medium,
  },
  timeMeta: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    lineHeight: 16,
  },
  chevronBtn: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
