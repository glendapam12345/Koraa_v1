import { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { DraggablePlannerTask } from '@/components/tasks/experience/DraggablePlannerTask';
import type { LifeArea, WeekPlannerTask } from '@/lib/lifeAreas/types';

type ColumnLayout = {
  columnId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AreaPlannerColumn = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  tasks: WeekPlannerTask[];
};

type AreasPlannerDragBoardProps = {
  columns: AreaPlannerColumn[];
  areas: LifeArea[];
  /** `hoy` quita franjas de color en columnas y filas. */
  appearance?: 'areas' | 'hoy';
  onMoveTask?: (taskId: string, sourceColumnId: string, targetColumnId: string) => void;
  onRequestMoveSheet?: (taskId: string, columnId: string) => void;
  onPressTask?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onDraggingChange?: (dragging: boolean) => void;
  emptyColumnHint: string;
  moveA11yLabel: (taskTitle: string) => string;
  deleteA11yLabel: (taskTitle: string) => string;
};

const DROP_HIT_SLOP = 28;

function headerTint(color: string): string {
  return `${color}22`;
}

function AreaColumn({
  column,
  areas,
  appearance = 'areas',
  isHover,
  dragActive,
  onMeasure,
  columnRef,
  onRequestMoveSheet,
  onPressTask,
  onToggleComplete,
  onDeleteTask,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragPrepare,
  onDragRelease,
  emptyColumnHint,
  moveA11yLabel,
  deleteA11yLabel,
}: {
  column: AreaPlannerColumn;
  areas: LifeArea[];
  appearance?: 'areas' | 'hoy';
  isHover: boolean;
  dragActive: boolean;
  onMeasure: () => void;
  columnRef: (node: View | null) => void;
  onRequestMoveSheet?: (taskId: string, columnId: string) => void;
  onPressTask?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onDragStart: (taskId: string) => void;
  onDragMove: (absoluteX: number, absoluteY: number) => void;
  onDragEnd: (taskId: string, sourceColumnId: string, absoluteX: number, absoluteY: number) => void;
  onDragPrepare?: () => void;
  onDragRelease?: () => void;
  emptyColumnHint: string;
  moveA11yLabel: (taskTitle: string) => string;
  deleteA11yLabel: (taskTitle: string) => string;
}) {
  const isEmpty = column.tasks.length === 0;
  const isHoy = appearance === 'hoy';
  const showDropTarget = isEmpty && dragActive;

  return (
    <View
      ref={columnRef}
      onLayout={onMeasure}
      style={[
        styles.column,
        isHoy && styles.columnHoy,
        !isHoy && { borderLeftColor: column.color, borderColor: `${column.color}55` },
        showDropTarget && styles.columnDropTarget,
        isHover && (isHoy ? styles.columnHoverHoy : styles.columnHover),
        isEmpty && !dragActive && styles.columnEmpty,
      ]}
    >
      <View
        style={[
          styles.columnHeader,
          !isHoy && { backgroundColor: headerTint(column.color) },
          isHoy && styles.columnHeaderHoy,
        ]}
      >
        {!isHoy ? (
          <View style={[styles.columnColorDot, { backgroundColor: column.color }]} />
        ) : null}
        <Text style={styles.columnEmoji}>{column.emoji}</Text>
        <Text style={styles.columnName} numberOfLines={1}>
          {column.name}
        </Text>
        <Text style={[styles.columnCount, isHoy && styles.columnCountHoy]}>
          {column.tasks.length}
        </Text>
      </View>

      {column.tasks.length > 0 ? (
        <View style={styles.tasks}>
          {column.tasks.map((task) => (
            <DraggablePlannerTask
              key={task.id}
              task={task}
              areas={areas}
              sourceDayId={column.id}
              compact
              softBorder={isHoy}
              dragActivation="handle"
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={(taskId, sourceColumnId, x, y) => {
                onDragEnd(taskId, sourceColumnId, x, y);
              }}
              onDragPrepare={onDragPrepare}
              onDragRelease={onDragRelease}
              onLongPressFallback={
                onRequestMoveSheet ? () => onRequestMoveSheet(task.id, column.id) : undefined
              }
              onPressTask={onPressTask}
              onToggleComplete={onToggleComplete}
              onMovePress={
                onRequestMoveSheet ? () => onRequestMoveSheet(task.id, column.id) : undefined
              }
              onDeletePress={onDeleteTask ? () => onDeleteTask(task.id) : undefined}
              moveA11yLabel={moveA11yLabel(task.title)}
              deleteA11yLabel={deleteA11yLabel(task.title)}
            />
          ))}
        </View>
      ) : (
        <Text style={[styles.emptyColumnHint, showDropTarget && styles.emptyColumnHintActive]}>
          {emptyColumnHint}
        </Text>
      )}
    </View>
  );
}

export function AreasPlannerDragBoard({
  columns,
  areas,
  appearance = 'areas',
  onMoveTask,
  onRequestMoveSheet,
  onPressTask,
  onToggleComplete,
  onDeleteTask,
  onDraggingChange,
  emptyColumnHint,
  moveA11yLabel,
  deleteA11yLabel,
}: AreasPlannerDragBoardProps) {
  const columnLayouts = useRef<Map<string, ColumnLayout>>(new Map());
  const columnRefs = useRef<Map<string, View | null>>(new Map());
  const draggingCountRef = useRef(0);
  const [hoverColumnId, setHoverColumnId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const measureColumns = useCallback(() => {
    for (const column of columns) {
      const ref = columnRefs.current.get(column.id);
      ref?.measureInWindow((x, y, width, height) => {
        columnLayouts.current.set(column.id, { columnId: column.id, x, y, width, height });
      });
    }
  }, [columns]);

  const findDropColumn = useCallback((absoluteX: number, absoluteY: number): string | null => {
    for (const layoutEntry of columnLayouts.current.values()) {
      if (
        absoluteX >= layoutEntry.x - DROP_HIT_SLOP &&
        absoluteX <= layoutEntry.x + layoutEntry.width + DROP_HIT_SLOP &&
        absoluteY >= layoutEntry.y - DROP_HIT_SLOP &&
        absoluteY <= layoutEntry.y + layoutEntry.height + DROP_HIT_SLOP
      ) {
        return layoutEntry.columnId;
      }
    }
    return null;
  }, []);

  const handleDragPrepare = useCallback(() => {
    draggingCountRef.current += 1;
    onDraggingChange?.(true);
  }, [onDraggingChange]);

  const handleDragRelease = useCallback(() => {
    draggingCountRef.current = Math.max(0, draggingCountRef.current - 1);
    if (draggingCountRef.current === 0) {
      onDraggingChange?.(false);
    }
  }, [onDraggingChange]);

  const handleDragStart = useCallback(
    (taskId: string) => {
      setDraggingTaskId(taskId);
      measureColumns();
    },
    [measureColumns],
  );

  const handleDragMove = useCallback(
    (absoluteX: number, absoluteY: number) => {
      const nextColumnId = findDropColumn(absoluteX, absoluteY);
      setHoverColumnId((current) => (current === nextColumnId ? current : nextColumnId));
    },
    [findDropColumn],
  );

  const handleDragEnd = useCallback(
    (taskId: string, sourceColumnId: string, absoluteX: number, absoluteY: number) => {
      const targetColumnId = findDropColumn(absoluteX, absoluteY);
      setHoverColumnId(null);
      setDraggingTaskId(null);

      if (!targetColumnId || targetColumnId === sourceColumnId || !onMoveTask) return;
      onMoveTask(taskId, sourceColumnId, targetColumnId);
    },
    [findDropColumn, onMoveTask],
  );

  const dragActive = draggingTaskId != null;

  return (
    <View style={styles.board} onLayout={measureColumns}>
      {columns.map((column) => (
        <AreaColumn
          key={column.id}
          column={column}
          areas={areas}
          appearance={appearance}
          isHover={hoverColumnId === column.id && dragActive}
          dragActive={dragActive}
          onMeasure={measureColumns}
          columnRef={(node) => {
            columnRefs.current.set(column.id, node);
          }}
          onRequestMoveSheet={onRequestMoveSheet}
          onPressTask={onPressTask}
          onToggleComplete={onToggleComplete}
          onDeleteTask={onDeleteTask}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDragPrepare={handleDragPrepare}
          onDragRelease={handleDragRelease}
          emptyColumnHint={emptyColumnHint}
          moveA11yLabel={moveA11yLabel}
          deleteA11yLabel={deleteA11yLabel}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    gap: THEME.layout.sectionGapCompact,
  },
  column: {
    borderLeftWidth: 3,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  columnHoy: {
    borderLeftWidth: 1,
    backgroundColor: THEME.colors.calm.card,
  },
  columnEmpty: {
    minHeight: 56,
  },
  columnDropTarget: {
    minHeight: 72,
    borderStyle: 'dashed',
    backgroundColor: THEME.colors.calm.mist,
  },
  columnHover: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
  },
  columnHoverHoy: {
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.mist,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
  },
  columnHeaderHoy: {
    backgroundColor: THEME.colors.calm.mist,
  },
  columnColorDot: {
    width: THEME.spacing.xs,
    height: THEME.spacing.xs,
    borderRadius: THEME.spacing.xs / 2,
    flexShrink: 0,
  },
  columnEmoji: {
    ...THEME.typography.displayEmojiSm,
    flexShrink: 0,
  },
  columnName: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 22,
  },
  columnCount: {
    ...THEME.typography.micro,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
    minWidth: 22,
    textAlign: 'center',
  },
  columnCountHoy: {
    color: THEME.colors.text.secondary,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  tasks: {
    gap: THEME.spacing.xs,
    padding: THEME.spacing.sm,
    paddingTop: 0,
  },
  emptyColumnHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    fontStyle: 'italic',
    lineHeight: 18,
    paddingHorizontal: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
  },
  emptyColumnHintActive: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    fontStyle: 'normal',
    textAlign: 'center',
    paddingVertical: THEME.spacing.sm,
  },
});
