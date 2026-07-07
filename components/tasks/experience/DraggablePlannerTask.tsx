import { useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ArrowRightLeft, Check, GripVertical, Star, Trash2 } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { LifeArea, WeekPlannerTask } from '@/lib/lifeAreas/types';

const DRAG_THRESHOLD = 8;
const LONG_PRESS_MS = 280;

type DragActivation = 'handle' | 'longPress' | 'immediate';

type DraggablePlannerTaskProps = {
  task: WeekPlannerTask;
  areas: LifeArea[];
  sourceDayId: string;
  compact?: boolean;
  /** Sin franja de color a la izquierda (tablero Hoy). */
  softBorder?: boolean;
  /** `handle` muestra dados y arrastra desde la asa; `longPress` en toda la fila. */
  dragActivation?: DragActivation;
  /** @deprecated Usa dragActivation */
  dragMode?: 'longPress' | 'immediate';
  onDragStart: (taskId: string) => void;
  onDragMove: (absoluteX: number, absoluteY: number) => void;
  onDragEnd: (taskId: string, sourceDayId: string, absoluteX: number, absoluteY: number) => void;
  onDragPrepare?: () => void;
  onDragRelease?: () => void;
  onPressTask?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
  onMovePress?: () => void;
  onDeletePress?: () => void;
  onLongPressFallback?: () => void;
  moveA11yLabel?: string;
  deleteA11yLabel?: string;
};

function findArea(areas: LifeArea[], id: string): LifeArea | undefined {
  return areas.find((area) => area.id === id);
}

function resolveDragActivation(
  dragActivation: DragActivation | undefined,
  dragMode: 'longPress' | 'immediate' | undefined,
): DragActivation {
  if (dragActivation) return dragActivation;
  if (dragMode === 'immediate') return 'immediate';
  return 'longPress';
}

export function DraggablePlannerTask({
  task,
  areas,
  sourceDayId,
  compact = false,
  softBorder = false,
  dragActivation,
  dragMode,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragPrepare,
  onDragRelease,
  onPressTask,
  onToggleComplete,
  onMovePress,
  onDeletePress,
  onLongPressFallback,
  moveA11yLabel = 'Mover',
  deleteA11yLabel = 'Eliminar',
}: DraggablePlannerTaskProps) {
  const { t } = useI18n();
  const area = findArea(areas, task.areaId);
  const activation = resolveDragActivation(dragActivation, dragMode);
  const useHandleDrag = activation === 'handle';
  const useLongPressDrag = activation === 'longPress';

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const draggingRef = useRef(false);
  const preparedRef = useRef(false);
  const lastMoveAtRef = useRef(0);

  const reportDragMove = useCallback(
    (absoluteX: number, absoluteY: number) => {
      const now = Date.now();
      if (now - lastMoveAtRef.current < 24) return;
      lastMoveAtRef.current = now;
      onDragMove(absoluteX, absoluteY);
    },
    [onDragMove],
  );

  const prepareDrag = useCallback(() => {
    if (preparedRef.current) return;
    preparedRef.current = true;
    onDragPrepare?.();
  }, [onDragPrepare]);

  const releaseDrag = useCallback(() => {
    if (!preparedRef.current) return;
    preparedRef.current = false;
    onDragRelease?.();
  }, [onDragRelease]);

  const pan = useMemo(() => {
    let gesture = Gesture.Pan();

    if (useLongPressDrag) {
      gesture = gesture.activateAfterLongPress(LONG_PRESS_MS);
    } else {
      gesture = gesture
        .minDistance(4)
        .activeOffsetX([-4, 4])
        .activeOffsetY([-4, 4]);
    }

    gesture = gesture
      .onStart(() => {
        draggingRef.current = true;
        lastMoveAtRef.current = 0;
        runOnJS(prepareDrag)();
        scale.value = 1.03;
        zIndex.value = 10;
        runOnJS(onDragStart)(task.id);
      })
      .onUpdate((event) => {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
        runOnJS(reportDragMove)(event.absoluteX, event.absoluteY);
      })
      .onEnd((event) => {
        const moved = Math.abs(event.translationX) + Math.abs(event.translationY);
        if (moved >= DRAG_THRESHOLD) {
          runOnJS(onDragEnd)(task.id, sourceDayId, event.absoluteX, event.absoluteY);
        } else if (onLongPressFallback && useLongPressDrag) {
          runOnJS(onLongPressFallback)();
        }
        translateX.value = withSpring(0, { damping: 22, stiffness: 380 });
        translateY.value = withSpring(0, { damping: 22, stiffness: 380 });
        scale.value = withSpring(1, { damping: 22, stiffness: 380 });
        zIndex.value = 0;
        draggingRef.current = false;
        runOnJS(releaseDrag)();
      })
      .onFinalize(() => {
        translateX.value = withSpring(0, { damping: 22, stiffness: 380 });
        translateY.value = withSpring(0, { damping: 22, stiffness: 380 });
        scale.value = withSpring(1, { damping: 22, stiffness: 380 });
        zIndex.value = 0;
        draggingRef.current = false;
        runOnJS(releaseDrag)();
      });

    return gesture;
  }, [
    onDragEnd,
    onDragStart,
    onLongPressFallback,
    prepareDrag,
    releaseDrag,
    reportDragMove,
    scale,
    sourceDayId,
    task.id,
    translateX,
    translateY,
    useLongPressDrag,
    zIndex,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
    elevation: zIndex.value > 0 ? 4 : 0,
  }));

  const accentColor = area?.color ?? THEME.colors.calm.lavenderDeep;
  const isDone = task.status === 'done';
  const isPriority = task.status === 'star';

  const handleToggleComplete = useCallback(() => {
    onToggleComplete?.(task.id);
  }, [onToggleComplete, task.id]);

  const completeA11yLabel = isDone
    ? t('semanaExtra.a11yWeekTaskCompleted')
    : t('hoy.focusTaskToggleA11y', { task: task.title });

  const compactMeta = useMemo(() => {
    if (!compact) return null;
    const parts = [task.timeLabel, task.durationLabel].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : null;
  }, [compact, task.durationLabel, task.timeLabel]);

  const fullMeta = useMemo(() => {
    const parts = [task.timeLabel, task.durationLabel].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : null;
  }, [task.durationLabel, task.timeLabel]);

  const statusControl = onToggleComplete ? (
    <TouchableOpacity
      style={styles.status}
      onPress={handleToggleComplete}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isDone }}
      accessibilityLabel={completeA11yLabel}
    >
      {isDone ? (
        <View style={styles.checkDone}>
          <Check size={14} color={THEME.colors.onGradient} strokeWidth={3} />
        </View>
      ) : (
        <View style={styles.checkRing} />
      )}
    </TouchableOpacity>
  ) : null;

  const dragHandle = (
    <View
      style={styles.dragHandle}
      accessibilityRole="button"
      accessibilityLabel={moveA11yLabel}
      accessibilityHint="Arrastra para mover"
    >
      <GripVertical size={16} color={THEME.colors.text.tertiary} strokeWidth={2.5} />
    </View>
  );

  const body = (
    <TouchableOpacity
      style={styles.body}
      onPress={() => onPressTask?.(task.id)}
      activeOpacity={0.88}
      disabled={!onPressTask}
      accessibilityRole="button"
      accessibilityLabel={task.title}
      accessibilityHint={onPressTask ? 'Editar' : undefined}
    >
      <View style={styles.bodyTextCol}>
        <View style={styles.titleRow}>
          {isPriority ? (
            <Star
              size={14}
              color={THEME.colors.accent.star}
              fill={THEME.colors.accent.star}
              style={styles.priorityStar}
            />
          ) : null}
          <Text
            style={[compact ? styles.titleCompact : styles.title, isDone && styles.titleDone]}
            numberOfLines={3}
          >
            {task.title}
          </Text>
        </View>
        {compact && compactMeta ? (
          <Text style={styles.metaCompact} numberOfLines={1}>
            {compactMeta}
          </Text>
        ) : null}
        {!compact && fullMeta ? (
          <Text style={styles.meta}>{fullMeta}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const actions = (
    <View style={styles.actions}>
      {onMovePress ? (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onMovePress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={moveA11yLabel}
        >
          <ArrowRightLeft size={15} color={THEME.colors.calm.lavenderDeep} />
        </TouchableOpacity>
      ) : null}
      {onDeletePress ? (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onDeletePress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={deleteA11yLabel}
        >
          <Trash2 size={15} color={THEME.colors.semantic.danger} />
        </TouchableOpacity>
      ) : null}
      {!compact ? <Text style={styles.icon}>{task.iconEmoji}</Text> : null}
    </View>
  );

  const rowStyle = [
    compact ? styles.rowCompact : styles.row,
    !softBorder && { borderLeftColor: accentColor },
    softBorder && styles.rowSoftBorder,
    animatedStyle,
  ];

  const handleNode = useHandleDrag ? (
    <GestureDetector gesture={pan}>
      <View>{dragHandle}</View>
    </GestureDetector>
  ) : (
    dragHandle
  );

  const draggableBody = useHandleDrag ? (
    body
  ) : (
    <GestureDetector gesture={pan}>
      <Animated.View style={styles.dragSurface}>{body}</Animated.View>
    </GestureDetector>
  );

  const rowContent = (
    <>
      {useHandleDrag ? handleNode : null}
      {draggableBody}
      {actions}
      {statusControl}
    </>
  );

  return (
    <Animated.View
      style={rowStyle}
      accessibilityHint={
        useHandleDrag
          ? 'Arrastra desde los dados o toca para editar'
          : useLongPressDrag
            ? 'Mantén presionado y arrastra para mover'
            : 'Arrastra para mover'
      }
    >
      {rowContent}
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
    gap: THEME.spacing.xs,
    paddingVertical: 8,
    paddingLeft: 4,
    paddingRight: THEME.spacing.sm,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderLeftWidth: 3,
    minHeight: 44,
  },
  rowSoftBorder: {
    borderLeftWidth: 1,
    backgroundColor: THEME.colors.calm.card,
  },
  dragHandle: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    flexShrink: 0,
    paddingVertical: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  actionBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  icon: {
    fontSize: THEME.typography.displayEmojiSm.fontSize,
    lineHeight: 24,
    width: 28,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  dragSurface: {
    flex: 1,
    minWidth: 0,
  },
  bodyTextCol: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    minWidth: 0,
  },
  priorityStar: {
    marginTop: 3,
    flexShrink: 0,
  },
  title: {
    ...THEME.typography.screenSubtitle,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 20,
    flex: 1,
  },
  titleCompact: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 20,
    flex: 1,
  },
  titleDone: {
    color: THEME.colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  metaCompact: {
    ...THEME.typography.small,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 14,
  },
  meta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  status: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkRing: {
    width: 22,
    height: 22,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 2,
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.fill[100],
  },
  checkDone: {
    width: 22,
    height: 22,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.semantic.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
