import { View, Text, StyleSheet, TouchableOpacity, Animated, Pressable } from 'react-native';
import { useEffect, useRef } from 'react';
import { Check, ChevronRight, Clock, Calendar, Trash2, ChevronUp, ChevronDown, Pencil, Star, AlarmClock } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyFocusTaskRowProps = {
  content: string;
  completed: boolean;
  index: number;
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
  onToggleComplete: () => void;
  onOpenDetails: () => void;
  onDelete?: () => void;
  onPostpone?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
};

export function HoyFocusTaskRow({
  content,
  completed,
  index,
  durationLabel,
  preferredTimeLabel,
  deadlineLabel,
  deadlineUrgent = false,
  projectId,
  projectName,
  projectColor = THEME.colors.gradient.blue,
  projectPercent = null,
  areaLabel,
  isPriority = false,
  onToggleComplete,
  onOpenDetails,
  onDelete,
  onPostpone,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}: HoyFocusTaskRowProps) {
  const { t } = useI18n();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!completed) return;
    pulse.setValue(1);
    Animated.sequence([
      Animated.spring(pulse, {
        toValue: 1.03,
        useNativeDriver: true,
        speed: 28,
        bounciness: 10,
      }),
      Animated.spring(pulse, {
        toValue: 1,
        useNativeDriver: true,
        speed: 24,
        bounciness: 6,
      }),
    ]).start();
  }, [completed, pulse]);

  const openProject = () => {
    if (!projectId) return;
    router.push(`/project/${projectId}`);
  };

  return (
    <Animated.View
      style={[
        styles.row,
        completed && styles.rowCompleted,
        { transform: [{ scale: pulse }] },
      ]}
    >
      <TouchableOpacity
        onPress={onToggleComplete}
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

      <View style={styles.bodyTouch}>
        <View style={styles.bodyTop}>
          <Text style={styles.index}>{index + 1}</Text>
          <TouchableOpacity
            style={styles.contentTouch}
            onPress={onOpenDetails}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={t('hoy.focusTaskOpenA11y', { task: content })}
            accessibilityHint={t('hoy.focusTaskOpenHint')}
          >
            <View style={styles.contentTitleRow}>
              {isPriority ? (
                <Star
                  size={14}
                  color={THEME.colors.calm.lavenderDeep}
                  fill={THEME.colors.calm.lavenderDeep}
                />
              ) : null}
              <Text style={[styles.content, completed && styles.contentDone]} numberOfLines={2}>
                {content}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onOpenDetails}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.75}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={t('hoy.focusTaskEditA11y', { task: content })}
            accessibilityHint={t('hoy.focusTaskOpenHint')}
          >
            <Pencil size={16} color={THEME.colors.calm.lavenderDeep} />
          </TouchableOpacity>
          {onDelete ? (
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.75}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel={t('taskCard.deleteTask', { task: content })}
            >
              <Trash2 size={16} color={THEME.colors.text.tertiary} />
            </TouchableOpacity>
          ) : (
            <ChevronRight size={16} color={THEME.colors.text.tertiary} style={styles.trailingChevron} />
          )}
        </View>

        <TouchableOpacity
          onPress={onOpenDetails}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={t('hoy.focusTaskOpenA11y', { task: content })}
        >
        {durationLabel || preferredTimeLabel || deadlineLabel ? (
          <View style={styles.metaRow}>
            {preferredTimeLabel ? (
              <View style={styles.metaChip}>
                <AlarmClock size={12} color={THEME.colors.text.secondary} />
                <Text style={styles.metaText}>{preferredTimeLabel}</Text>
              </View>
            ) : null}
            {durationLabel ? (
              <View style={styles.metaChip}>
                <Clock size={12} color={THEME.colors.text.secondary} />
                <Text style={styles.metaText}>{durationLabel}</Text>
              </View>
            ) : null}
            {deadlineLabel ? (
              <View style={[styles.metaChip, deadlineUrgent && styles.metaChipUrgent]}>
                <Calendar
                  size={12}
                  color={deadlineUrgent ? THEME.colors.semantic.danger : THEME.colors.text.secondary}
                />
                <Text style={[styles.metaText, deadlineUrgent && styles.metaTextUrgent]}>
                  {deadlineLabel}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {projectId && projectName ? (
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              openProject();
            }}
            style={({ pressed }) => [
              styles.projectChip,
              { borderColor: `${projectColor}55`, backgroundColor: `${projectColor}14` },
              pressed && styles.projectChipPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('hoy.focusTaskOpenProjectA11y', {
              project: projectName,
              percent: projectPercent ?? 0,
            })}
          >
            {areaLabel ? (
              <Text style={styles.projectArea} numberOfLines={1}>
                {areaLabel}
              </Text>
            ) : null}
            <Text style={[styles.projectName, { color: projectColor }]} numberOfLines={1}>
              {projectName}
            </Text>
            {projectPercent != null ? (
              <Text style={styles.projectPercent}>{projectPercent}%</Text>
            ) : null}
            <ChevronRight size={14} color={projectColor} />
          </Pressable>
        ) : (
          <Text style={styles.looseLabel}>{t('hoy.focusTaskNoProject')}</Text>
        )}

        {!completed && (onPostpone || onMoveUp || onMoveDown) ? (
          <View style={styles.actionsRow}>
            {onPostpone ? (
              <TouchableOpacity
                onPress={(event) => {
                  event.stopPropagation();
                  onPostpone();
                }}
                activeOpacity={0.85}
                style={styles.actionChip}
                accessibilityRole="button"
                accessibilityLabel={t('hoy.postponeStepA11y', { task: content })}
              >
                <Text style={styles.actionChipText}>{t('hoy.postponeStep')}</Text>
              </TouchableOpacity>
            ) : null}
            {onMoveUp || onMoveDown ? (
              <View style={styles.reorderGroup}>
                {onMoveUp ? (
                  <TouchableOpacity
                    onPress={(event) => {
                      event.stopPropagation();
                      onMoveUp();
                    }}
                    disabled={!canMoveUp}
                    activeOpacity={0.85}
                    style={[styles.reorderBtn, !canMoveUp && styles.reorderBtnDisabled]}
                    accessibilityRole="button"
                    accessibilityLabel={t('hoy.moveStepUpA11y', { task: content })}
                    accessibilityState={{ disabled: !canMoveUp }}
                  >
                    <ChevronUp
                      size={16}
                      color={canMoveUp ? THEME.colors.calm.lavenderDeep : THEME.colors.text.tertiary}
                    />
                  </TouchableOpacity>
                ) : null}
                {onMoveDown ? (
                  <TouchableOpacity
                    onPress={(event) => {
                      event.stopPropagation();
                      onMoveDown();
                    }}
                    disabled={!canMoveDown}
                    activeOpacity={0.85}
                    style={[styles.reorderBtn, !canMoveDown && styles.reorderBtnDisabled]}
                    accessibilityRole="button"
                    accessibilityLabel={t('hoy.moveStepDownA11y', { task: content })}
                    accessibilityState={{ disabled: !canMoveDown }}
                  >
                    <ChevronDown
                      size={16}
                      color={canMoveDown ? THEME.colors.calm.lavenderDeep : THEME.colors.text.tertiary}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
  },
  rowCompleted: {
    opacity: 0.72,
  },
  checkTouch: {
    alignSelf: 'flex-start',
    marginTop: 2,
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
  },
  checkDone: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: THEME.colors.gradient.blue,
    borderWidth: 2,
    borderColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyTouch: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  bodyTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  contentTouch: {
    flex: 1,
    minWidth: 0,
  },
  contentTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  trailingChevron: {
    marginTop: 4,
  },
  index: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    marginTop: 2,
    width: 14,
  },
  content: {
    ...THEME.typography.body,
    flex: 1,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 22,
  },
  contentDone: {
    color: THEME.colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingLeft: 20,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
  },
  metaChipUrgent: {
    backgroundColor: THEME.colors.semantic.dangerSoft,
  },
  metaText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 14,
  },
  metaTextUrgent: {
    color: THEME.colors.semantic.danger,
    fontFamily: THEME.fonts.heading.medium,
  },
  projectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginLeft: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    maxWidth: '100%',
  },
  projectChipPressed: {
    opacity: 0.85,
  },
  projectArea: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 14,
    maxWidth: 72,
  },
  projectName: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
    flexShrink: 1,
    lineHeight: 14,
  },
  projectPercent: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 14,
  },
  looseLabel: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    marginLeft: 20,
    lineHeight: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.xs,
    marginLeft: 20,
    marginTop: 2,
  },
  actionChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: 32,
    justifyContent: 'center',
  },
  actionChipText: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 14,
  },
  reorderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
  },
  reorderBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  reorderBtnDisabled: {
    opacity: 0.45,
  },
});
