import { View, Text, StyleSheet, TouchableOpacity, Animated, Pressable } from 'react-native';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronRight, Clock, Calendar, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyFocusTaskRowProps = {
  content: string;
  completed: boolean;
  index: number;
  durationLabel?: string | null;
  deadlineLabel?: string | null;
  deadlineUrgent?: boolean;
  projectId?: string | null;
  projectName?: string | null;
  projectColor?: string;
  projectPercent?: number | null;
  areaLabel?: string | null;
  onToggleComplete: () => void;
  onOpenDetails: () => void;
  onDelete?: () => void;
};

export function HoyFocusTaskRow({
  content,
  completed,
  index,
  durationLabel,
  deadlineLabel,
  deadlineUrgent = false,
  projectId,
  projectName,
  projectColor = THEME.colors.gradient.blue,
  projectPercent = null,
  areaLabel,
  onToggleComplete,
  onOpenDetails,
  onDelete,
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
            <Check size={16} color={THEME.colors.onGradient} strokeWidth={3} />
          </View>
        ) : (
          <LinearGradient
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkRing}
          >
            <View style={styles.checkInner} />
          </LinearGradient>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bodyTouch}
        onPress={onOpenDetails}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={t('hoy.focusTaskOpenA11y', { task: content })}
        accessibilityHint={t('hoy.focusTaskOpenHint')}
      >
        <View style={styles.bodyTop}>
          <Text style={styles.index}>{index + 1}</Text>
          <Text style={[styles.content, completed && styles.contentDone]} numberOfLines={2}>
            {content}
          </Text>
          {onDelete ? (
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('taskCard.deleteTask', { task: content })}
            >
              <Trash2 size={16} color={THEME.colors.text.tertiary} />
            </TouchableOpacity>
          ) : (
            <ChevronRight size={16} color={THEME.colors.text.tertiary} />
          )}
        </View>

        {durationLabel || deadlineLabel ? (
          <View style={styles.metaRow}>
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
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    ...THEME.shadows.soft,
  },
  rowCompleted: {
    backgroundColor: THEME.colors.calm.mist,
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME.colors.calm.card,
  },
  checkDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.gradient.blue,
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
    gap: 6,
  },
  index: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
    marginTop: 2,
    width: 14,
  },
  content: {
    ...THEME.typography.screenSubtitle,
    flex: 1,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 20,
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
});
