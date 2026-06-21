import { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Check, Circle, Star, GripVertical } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import type { LifeArea, WeekPlannerTask } from '@/lib/lifeAreas/types';

const DRAG_THRESHOLD = 12;

type DraggablePlannerTaskProps = {
  task: WeekPlannerTask;
  areas: LifeArea[];
  sourceDayId: string;
  onDragStart: (taskId: string) => void;
  onDragMove: (absoluteX: number, absoluteY: number) => void;
  onDragEnd: (taskId: string, sourceDayId: string, absoluteX: number, absoluteY: number) => void;
  onLongPressFallback?: () => void;
};

function findArea(areas: LifeArea[], id: string): LifeArea | undefined {
  return areas.find((area) => area.id === id);
}

export function DraggablePlannerTask({
  task,
  areas,
  sourceDayId,
  onDragStart,
  onDragMove,
  onDragEnd,
  onLongPressFallback,
}: DraggablePlannerTaskProps) {
  const area = findArea(areas, task.areaId);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const draggingRef = useRef(false);

  const pan = Gesture.Pan()
    .activateAfterLongPress(220)
    .onStart(() => {
      draggingRef.current = true;
      scale.value = 1.04;
      zIndex.value = 20;
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
    elevation: zIndex.value > 0 ? 8 : 0,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.row,
          area ? { borderLeftColor: area.color } : null,
          animatedStyle,
        ]}
      >
        <GripVertical size={16} color={THEME.colors.text.tertiary} />
        <Text style={styles.icon}>{task.iconEmoji}</Text>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {task.title}
          </Text>
          <Text style={styles.meta}>
            {task.timeLabel} · {task.durationLabel}
          </Text>
        </View>
        <View style={styles.status}>
          {task.status === 'done' ? (
            <Check size={18} color={THEME.colors.semantic.success} strokeWidth={2.5} />
          ) : task.status === 'star' ? (
            <Star size={18} color={THEME.colors.accent.star} fill={THEME.colors.accent.star} />
          ) : (
            <Circle size={18} color={THEME.colors.text.tertiary} strokeWidth={2} />
          )}
        </View>
      </Animated.View>
    </GestureDetector>
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
    borderRadius: 18,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.calm.lavenderDeep,
    ...THEME.shadows.soft,
  },
  icon: {
    fontSize: THEME.typography.displayEmojiSm.fontSize,
    lineHeight: 24,
    width: 28,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...THEME.typography.screenSubtitle,
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
    alignItems: 'center',
  },
});
