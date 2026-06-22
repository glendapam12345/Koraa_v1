import { useCallback, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { DraggablePlannerTask } from '@/components/tasks/experience/DraggablePlannerTask';
import type { LifeArea, WeekPlannerDay } from '@/lib/lifeAreas/types';
import type { SemanaBoardLayout } from '@/lib/semana/rangeMode';

type ColumnLayout = {
  dayId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type WeekPlannerDragBoardProps = {
  days: WeekPlannerDay[];
  areas: LifeArea[];
  layout?: SemanaBoardLayout;
  onMoveTask?: (taskId: string, targetDayId: string) => Promise<{ ok: boolean }>;
  onRequestMoveSheet?: (taskId: string, dayId: string) => void;
  onPressTask?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
};

const HORIZONTAL_PADDING = THEME.layout.screenPaddingX * 2;
const PHONE_BREAKPOINT = 520;

function columnsForLayout(layout: SemanaBoardLayout, windowWidth: number): number {
  if (layout === 'day') return 1;
  if (layout === 'weekGrid') return 1;
  return windowWidth >= PHONE_BREAKPOINT ? 3 : 2;
}

function chunkDays<T>(items: T[], columnsPerRow: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columnsPerRow) {
    rows.push(items.slice(i, i + columnsPerRow));
  }
  return rows;
}

function DayColumn({
  day,
  areas,
  isHover,
  columnWidth,
  layout,
  onMeasure,
  columnRef,
  onMoveTask,
  onRequestMoveSheet,
  onPressTask,
  onToggleComplete,
  onDragStart,
  onDragMove,
  onDragEnd,
  todayLabel,
  emptyDayHint,
}: {
  day: WeekPlannerDay;
  areas: LifeArea[];
  isHover: boolean;
  columnWidth: number;
  layout: SemanaBoardLayout;
  onMeasure: () => void;
  columnRef: (node: View | null) => void;
  onMoveTask?: (taskId: string, targetDayId: string) => Promise<{ ok: boolean }>;
  onRequestMoveSheet?: (taskId: string, dayId: string) => void;
  onPressTask?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
  onDragStart: (taskId: string) => void;
  onDragMove: (absoluteX: number, absoluteY: number) => void;
  onDragEnd: (taskId: string, sourceDayId: string, absoluteX: number, absoluteY: number) => void;
  todayLabel: string;
  emptyDayHint: string;
}) {
  const isEmpty = day.tasks.length === 0;
  const isListLayout = layout === 'weekGrid' || layout === 'day';

  return (
    <View
      ref={columnRef}
      onLayout={onMeasure}
      style={[
        styles.column,
        { width: columnWidth },
        isListLayout && styles.columnList,
        day.isToday && styles.columnToday,
        isHover && styles.columnHover,
        isEmpty && isListLayout && styles.columnEmpty,
      ]}
    >
      <View style={styles.columnHeader}>
        <View style={styles.columnHeaderRow}>
          <Text style={[styles.columnTitle, day.isToday && styles.columnTitleToday]}>
            {day.shortLabel}
          </Text>
          {day.isToday ? (
            <View style={styles.todayPill}>
              <Text style={styles.todayPillText}>{todayLabel}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.columnSummary} numberOfLines={1}>
          {day.summary}
        </Text>
      </View>
      {day.tasks.length > 0 ? (
        <View style={styles.tasks}>
          {day.tasks.map((task) => (
            <DraggablePlannerTask
              key={task.id}
              task={task}
              areas={areas}
              sourceDayId={day.id}
              compact
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={(taskId, sourceDayId, x, y) => {
                void onDragEnd(taskId, sourceDayId, x, y);
              }}
              onLongPressFallback={
                onRequestMoveSheet ? () => onRequestMoveSheet(task.id, day.id) : undefined
              }
              onPressTask={onPressTask}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </View>
      ) : isListLayout ? (
        <Text style={styles.emptyDayHint}>{emptyDayHint}</Text>
      ) : null}
    </View>
  );
}

export function WeekPlannerDragBoard({
  days,
  areas,
  layout = 'weekGrid',
  onMoveTask,
  onRequestMoveSheet,
  onPressTask,
  onToggleComplete,
}: WeekPlannerDragBoardProps) {
  const { t } = useI18n();
  const { width: windowWidth } = useWindowDimensions();
  const columnLayouts = useRef<Map<string, ColumnLayout>>(new Map());
  const columnRefs = useRef<Map<string, View | null>>(new Map());
  const [hoverDayId, setHoverDayId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const columnsPerRow = columnsForLayout(layout, windowWidth);
  const isListLayout = layout === 'weekGrid' || layout === 'day';
  const columnWidth = useMemo(() => {
    if (isListLayout) {
      return windowWidth - HORIZONTAL_PADDING;
    }
    const gaps = (columnsPerRow - 1) * THEME.spacing.sm;
    const available = windowWidth - HORIZONTAL_PADDING - gaps;
    return Math.max(120, Math.floor(available / columnsPerRow));
  }, [columnsPerRow, isListLayout, windowWidth]);

  const dayRows = useMemo(() => chunkDays(days, columnsPerRow), [days, columnsPerRow]);

  const measureColumns = useCallback(() => {
    for (const day of days) {
      const ref = columnRefs.current.get(day.id);
      ref?.measureInWindow((x, y, width, height) => {
        columnLayouts.current.set(day.id, { dayId: day.id, x, y, width, height });
      });
    }
  }, [days]);

  const findDropDay = useCallback((absoluteX: number, absoluteY: number): string | null => {
    for (const layoutEntry of columnLayouts.current.values()) {
      if (
        absoluteX >= layoutEntry.x &&
        absoluteX <= layoutEntry.x + layoutEntry.width &&
        absoluteY >= layoutEntry.y &&
        absoluteY <= layoutEntry.y + layoutEntry.height
      ) {
        return layoutEntry.dayId;
      }
    }
    return null;
  }, []);

  const handleDragStart = useCallback(
    (taskId: string) => {
      setDraggingTaskId(taskId);
      measureColumns();
    },
    [measureColumns],
  );

  const handleDragMove = useCallback(
    (absoluteX: number, absoluteY: number) => {
      setHoverDayId(findDropDay(absoluteX, absoluteY));
    },
    [findDropDay],
  );

  const handleDragEnd = useCallback(
    async (taskId: string, sourceDayId: string, absoluteX: number, absoluteY: number) => {
      const targetDayId = findDropDay(absoluteX, absoluteY);
      setHoverDayId(null);
      setDraggingTaskId(null);

      if (!targetDayId || targetDayId === sourceDayId || !onMoveTask) return;
      await onMoveTask(taskId, targetDayId);
    },
    [findDropDay, onMoveTask],
  );

  const renderColumn = (day: WeekPlannerDay) => (
    <DayColumn
      key={day.id}
      day={day}
      areas={areas}
      isHover={hoverDayId === day.id && draggingTaskId != null}
      columnWidth={columnWidth}
      layout={layout}
      onMeasure={measureColumns}
      columnRef={(node) => {
        columnRefs.current.set(day.id, node);
      }}
      onMoveTask={onMoveTask}
      onRequestMoveSheet={onRequestMoveSheet}
      onPressTask={onPressTask}
      onToggleComplete={onToggleComplete}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      todayLabel={t('semana.today')}
      emptyDayHint={t('semana.plannerEmptyDayHint')}
    />
  );

  if (layout === 'weekGrid' || layout === 'monthGrid') {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridScroll}
        onLayout={measureColumns}
      >
        {dayRows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.gridRow}>
            {row.map((day) => renderColumn(day))}
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      horizontal={days.length > 1}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.board}
      onLayout={measureColumns}
    >
      {days.map((day) => renderColumn(day))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  board: {
    gap: THEME.spacing.sm,
    paddingBottom: 4,
  },
  gridScroll: {
    gap: THEME.spacing.sm,
    paddingBottom: 4,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
  },
  column: {
    gap: THEME.spacing.xs,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    overflow: 'hidden',
  },
  columnList: {
    alignSelf: 'stretch',
  },
  columnToday: {
    borderColor: THEME.colors.calm.lavender,
    backgroundColor: THEME.colors.calm.blush,
  },
  columnEmpty: {
    paddingVertical: THEME.spacing.sm,
  },
  columnHover: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
  },
  columnHeader: {
    gap: 2,
    paddingHorizontal: 2,
    paddingBottom: 4,
    marginBottom: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
  },
  columnHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  columnTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    letterSpacing: 0.2,
  },
  columnTitleToday: {
    color: THEME.colors.calm.lavenderDeep,
  },
  todayPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  todayPillText: {
    ...THEME.typography.micro,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  columnSummary: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  emptyDayHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    fontStyle: 'italic',
    lineHeight: 16,
    paddingHorizontal: 2,
  },
  tasks: {
    gap: THEME.spacing.xs,
  },
});
