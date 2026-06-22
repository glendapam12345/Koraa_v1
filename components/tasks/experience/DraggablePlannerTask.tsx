import { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Gesture, GestureDetector, TouchableOpacity } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Check, Circle, Star, GripVertical } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import type { LifeArea, WeekPlannerTask } from '@/lib/lifeAreas/types';

const DRAG_THRESHOLD = 8;
const DRAG_LONG_PRESS_MS = 160;

type DraggablePlannerTaskProps = {
  task: WeekPlannerTask;
  areas: LifeArea[];
  sourceDayId: string;
  compact?: boolean;
  onDragStart: (taskId: string) => void;
  onDragMove: (absoluteX: number, absoluteY: number) => void;
  onDragEnd: (taskId: string, sourceDayId: string, absoluteX: number, absoluteY: number) => void;
  onPressTask?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
  onLongPressFallback?: () => void;
};

function findArea(areas: LifeArea[], id: string): LifeArea | undefined {
  return areas.find((area) => area.id === id);
}

export function DraggablePlannerTask({
  task,
  areas,
  sourceDayId,
  compact = false,
  onDragStart,
  onDragMove,
  onDragEnd,
  onPressTask,
  onToggleComplete,
  onLongPressFallback,
}: DraggablePlannerTaskProps) {
  const area = findArea(areas, task.areaId);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const draggingRef = useRef(false);

  const pan = Gesture.Pan()
    .activateAfterLongPress(DRAG_LONG_PRESS_MS)
    .onStart(() => {
      draggingRef.current = true;
      scale.value = 1.02;
      zIndex.value = 10;
      runOnJS(onDragStart)(task.id);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      runOnJS(onDragMove)(event.absoluteX, event.absoluteY);
    })
    .onEnd((event) => {
      const moved = Math.abs(event.translationX) + Math.abs(event.translationY);
      if (moved < DRAG_THRESHOLD && onLongPressFallback) {
        runOnJS(onLongPressFallback)();
      } else {
        runOnJS(onDragEnd)(task.id, sourceDayId, event.absoluteX, event.absoluteY);
      }
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
      draggingRef.current = false;
    })
    .onFinalize(() => {
      if (!draggingRef.current) return;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
      draggingRef.current = false;
    });

  const tap = Gesture.Tap().onEnd(() => {
    if (onPressTask) {
      runOnJS(onPressTask)(task.id);
    }
  });

  const bodyGesture = onPressTask ? Gesture.Exclusive(pan, tap) : pan;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
    elevation: zIndex.value > 0 ? 3 : 0,
  }));

  const accentColor = area?.color ?? THEME.colors.calm.lavenderDeep;
  const isDone = task.status === 'done';
  const isPriority = task.status === 'star';

  return (
    <Animated.View
      style={[
        compact ? styles.rowCompact : styles.row,
        { borderLeftColor: accentColor },
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        style={styles.status}
        onPress={() => onToggleComplete?.(task.id)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isDone }}
      >
        {isDone ? (
          <Check size={16} color={THEME.colors.semantic.success} strokeWidth={2.5} />
        ) : isPriority ? (
          <Star size={16} color={THEME.colors.accent.star} fill={THEME.colors.accent.star} />
        ) : (
          <Circle size={16} color={THEME.colors.calm.lavenderDeep} strokeWidth={2} />
        )}
      </TouchableOpacity>

      <GestureDetector gesture={bodyGesture}>
        <Animated.View style={styles.body}>
          {onPressTask ? (
            <View style={styles.dragHandle}>
              <GripVertical size={14} color={THEME.colors.text.tertiary} />
            </View>
          ) : null}
          <View style={styles.bodyTextCol}>
            <Text style={compact ? styles.titleCompact : styles.title} numberOfLines={2}>
              {task.title}
            </Text>
            {!compact ? (
              <Text style={styles.meta}>
                {task.timeLabel} · {task.durationLabel}
              </Text>
            ) : null}
          </View>
        </Animated.View>
      </GestureDetector>

      {compact ? (
        <View style={[styles.areaDot, { backgroundColor: accentColor }]} />
      ) : (
        <Text style={styles.icon}>{task.iconEmoji}</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.rounded,
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.calm.lavenderDeep,
  },
  rowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.sm,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderLeftWidth: 3,
    minHeight: 44,
  },
  areaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  icon: {
    fontSize: THEME.typography.displayEmojiSm.fontSize,
    lineHeight: 24,
    width: 28,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  bodyTextCol: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  dragHandle: {
    flexShrink: 0,
    opacity: 0.7,
  },
  title: {
    ...THEME.typography.screenSubtitle,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 20,
  },
  titleCompact: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 20,
  },
  meta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  status: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
