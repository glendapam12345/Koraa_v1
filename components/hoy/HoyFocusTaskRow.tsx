import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronRight, FolderKanban, Trash2 } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { Task } from '@/components/tasks/TaskCard';

type HoyFocusTaskRowProps = {
  task: Task;
  index: number;
  projectName?: string | null;
  onToggleComplete: () => void;
  onOpenDetails: () => void;
  onDelete?: () => void;
};

export function HoyFocusTaskRow({
  task,
  index,
  projectName,
  onToggleComplete,
  onOpenDetails,
  onDelete,
}: HoyFocusTaskRowProps) {
  const { t } = useI18n();
  const completed = task.is_completed;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!completed) return;
    pulse.setValue(1);
    Animated.sequence([
      Animated.spring(pulse, {
        toValue: 1.04,
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
        accessibilityLabel={t('hoy.focusTaskToggleA11y', { task: task.content })}
        style={styles.checkTouch}
      >
        {completed ? (
          <View style={styles.checkDone}>
            <Check size={18} color={THEME.colors.onGradient} strokeWidth={3} />
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
        accessibilityLabel={t('hoy.focusTaskOpenA11y', { task: task.content })}
        accessibilityHint={t('hoy.focusTaskOpenHint')}
      >
        <View style={styles.bodyTop}>
          <Text style={styles.index}>{index + 1}</Text>
          <Text style={[styles.content, completed && styles.contentDone]} numberOfLines={3}>
            {task.content}
          </Text>
          {onDelete ? (
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('taskCard.deleteTask', { task: task.content })}
            >
              <Trash2 size={18} color={THEME.colors.text.tertiary} />
            </TouchableOpacity>
          ) : (
            <ChevronRight size={18} color={THEME.colors.text.tertiary} />
          )}
        </View>
        {projectName ? (
          <View style={styles.metaRow}>
            <FolderKanban size={16} color={THEME.colors.gradient.blue} />
            <Text style={styles.metaProject} numberOfLines={1}>
              {projectName}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.card,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    ...THEME.shadows.soft,
  },
  rowCompleted: {
    backgroundColor: THEME.colors.fill[200],
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  checkTouch: {
    alignSelf: 'center',
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.fill[100],
  },
  checkDone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyTouch: {
    flex: 1,
    minWidth: 0,
  },
  bodyTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.xs,
  },
  index: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
    marginTop: 2,
    width: 16,
  },
  content: {
    ...THEME.typography.body,
    fontSize: 17,
    flex: 1,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 24,
  },
  contentDone: {
    color: THEME.colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
    paddingLeft: 20,
  },
  metaProject: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
    flex: 1,
  },
});
