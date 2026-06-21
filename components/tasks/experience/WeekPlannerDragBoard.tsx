import { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { THEME } from '@/constants/theme';
import { DraggablePlannerTask } from '@/components/tasks/experience/DraggablePlannerTask';
import type { LifeArea, WeekPlannerDay } from '@/lib/lifeAreas/types';

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
  onMoveTask?: (taskId: string, targetDayId: string) => Promise<{ ok: boolean }>;
  onRequestMoveSheet?: (taskId: string, dayId: string) => void;
};

export function WeekPlannerDragBoard({
  days,
  areas,
  onMoveTask,
  onRequestMoveSheet,
}: WeekPlannerDragBoardProps) {
  const columnLayouts = useRef<Map<string, ColumnLayout>>(new Map());
  const columnRefs = useRef<Map<string, View | null>>(new Map());
  const [hoverDayId, setHoverDayId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const measureColumns = useCallback(() => {
    for (const day of days) {
      const ref = columnRefs.current.get(day.id);
      ref?.measureInWindow((x, y, width, height) => {
        columnLayouts.current.set(day.id, { dayId: day.id, x, y, width, height });
      });
    }
  }, [days]);

  const findDropDay = useCallback((absoluteX: number, absoluteY: number): string | null => {
    for (const layout of columnLayouts.current.values()) {
      if (
        absoluteX >= layout.x &&
        absoluteX <= layout.x + layout.width &&
        absoluteY >= layout.y &&
        absoluteY <= layout.y + layout.height
      ) {
        return layout.dayId;
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

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.board}
      onLayout={measureColumns}
    >
      {days.map((day) => {
        const isHover = hoverDayId === day.id && draggingTaskId != null;
        return (
          <View
            key={day.id}
            ref={(node) => {
              columnRefs.current.set(day.id, node);
            }}
            onLayout={measureColumns}
            style={[styles.column, isHover && styles.columnHover]}
          >
            <View style={styles.columnHeader}>
              <Text style={styles.columnTitle}>{day.shortLabel}</Text>
              <Text style={styles.columnSummary}>{day.summary}</Text>
            </View>
            <View style={styles.tasks}>
              {day.tasks.map((task) => (
                <DraggablePlannerTask
                  key={task.id}
                  task={task}
                  areas={areas}
                  sourceDayId={day.id}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={(taskId, sourceDayId, x, y) => {
                    void handleDragEnd(taskId, sourceDayId, x, y);
                  }}
                  onLongPressFallback={
                    onRequestMoveSheet
                      ? () => onRequestMoveSheet(task.id, day.id)
                      : undefined
                  }
                />
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  board: {
    gap: THEME.spacing.sm,
    paddingBottom: 4,
  },
  column: {
    width: 220,
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: 20,
    backgroundColor: THEME.colors.surfaceOverlay.glass,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceOverlay.glassBorderLight,
  },
  columnHover: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
  },
  columnHeader: {
    gap: 2,
    paddingHorizontal: 4,
  },
  columnTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    letterSpacing: 0.3,
  },
  columnSummary: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  tasks: {
    gap: 8,
    minHeight: 80,
  },
});
