import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FolderKanban, Pencil, Plus } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { DraggablePlannerTask } from '@/components/tasks/experience/DraggablePlannerTask';
import type { LifeArea } from '@/lib/lifeAreas/types';
import {
  countTasksInColumn,
  filterVisibleBrainDumpAreaColumns,
  splitBrainDumpBoardColumns,
  type BrainDumpAreaColumn,
  type BrainDumpProjectGroup,
} from '@/lib/review/buildBrainDumpAreaBoardModel';

type ColumnLayout = {
  columnId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type BrainDumpAreaDragBoardProps = {
  columns: BrainDumpAreaColumn[];
  areas: LifeArea[];
  onMoveTask: (taskId: string, targetColumnId: string) => void;
  onPressColumnHeader?: (column: BrainDumpAreaColumn) => void;
  onPressTask?: (taskId: string) => void;
  onPressAddProject?: (column: BrainDumpAreaColumn) => void;
  emptyColumnHint: string;
  renameColumnA11y: string;
  addProjectLabel: string;
  /** Oculta columnas vacías; al arrastrar muestra todas como destinos. */
  hideEmptyColumns?: boolean;
  dragHint?: string;
  boardHint?: string;
  /** Tareas sueltas arriba, áreas abajo con pie opcional. */
  splitLayout?: boolean;
  looseSectionTitle?: string;
  areasSectionTitle?: string;
  areasFooter?: ReactNode;
};

type AreaColumnProps = {
  column: BrainDumpAreaColumn;
  areas: LifeArea[];
  isHover: boolean;
  emptyColumnHint: string;
  renameColumnA11y: string;
  addProjectLabel: string;
  compactDropTarget?: boolean;
  onMeasure: () => void;
  columnRef: (node: View | null) => void;
  onPressColumnHeader?: (column: BrainDumpAreaColumn) => void;
  onPressTask?: (taskId: string) => void;
  onPressAddProject?: (column: BrainDumpAreaColumn) => void;
  onDragStart: (taskId: string) => void;
  onDragMove: (absoluteX: number, absoluteY: number) => void;
  onDragEnd: (taskId: string, sourceColumnId: string, absoluteX: number, absoluteY: number) => void;
};

function ProjectGroupSection({
  group,
  column,
  areas,
  emptyHint,
  onPressTask,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  group: BrainDumpProjectGroup;
  column: BrainDumpAreaColumn;
  areas: LifeArea[];
  emptyHint: string;
  onPressTask?: (taskId: string) => void;
  onDragStart: (taskId: string) => void;
  onDragMove: (absoluteX: number, absoluteY: number) => void;
  onDragEnd: (taskId: string, sourceColumnId: string, absoluteX: number, absoluteY: number) => void;
}) {
  const isLooseGroup = group.id.startsWith('loose-in-');

  return (
    <View style={styles.projectGroup}>
      {!isLooseGroup ? (
        <View style={styles.projectHeader}>
          <FolderKanban size={14} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.projectName} numberOfLines={2}>
            {group.name}
          </Text>
          {group.dueDateLabel ? (
            <Text style={styles.projectDue} numberOfLines={1}>
              {group.dueDateLabel}
            </Text>
          ) : null}
        </View>
      ) : group.tasks.length > 0 ? (
        <Text style={styles.looseGroupLabel}>{group.name}</Text>
      ) : null}

      {group.tasks.length > 0 ? (
        <View style={styles.tasks}>
          {group.tasks.map((task) => (
            <DraggablePlannerTask
              key={task.id}
              task={task}
              areas={areas}
              sourceDayId={column.id}
              compact
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={(taskId, sourceColumnId, x, y) => {
                onDragEnd(taskId, sourceColumnId, x, y);
              }}
              onPressTask={onPressTask}
              onLongPressFallback={onPressTask ? () => onPressTask(task.id) : undefined}
            />
          ))}
        </View>
      ) : !isLooseGroup ? (
        <Text style={styles.emptyProjectHint}>{emptyHint}</Text>
      ) : null}
    </View>
  );
}

function AreaColumn({
  column,
  areas,
  isHover,
  emptyColumnHint: emptyHint,
  renameColumnA11y,
  addProjectLabel,
  compactDropTarget = false,
  onMeasure,
  columnRef,
  onPressColumnHeader,
  onPressTask,
  onPressAddProject,
  onDragStart,
  onDragMove,
  onDragEnd,
}: AreaColumnProps) {
  const canRename = !column.isLoose && onPressColumnHeader;
  const taskCount = countTasksInColumn(column);
  const canAddProject = !column.isLoose && column.ref && onPressAddProject && !compactDropTarget;

  if (compactDropTarget) {
    return (
      <View
        ref={columnRef}
        onLayout={onMeasure}
        style={[styles.column, styles.columnDropTarget, isHover ? styles.columnHover : null]}
      >
        <View style={styles.columnHeaderRow}>
          <Text style={styles.columnEmoji}>{column.emoji}</Text>
          <Text style={styles.columnTitle} numberOfLines={1}>
            {column.name}
          </Text>
          <Text style={styles.dropTargetHint}>{emptyHint}</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      ref={columnRef}
      onLayout={onMeasure}
      style={[
        styles.column,
        column.isLoose ? styles.columnLoose : null,
        isHover ? styles.columnHover : null,
      ]}
    >
      <TouchableOpacity
        style={styles.columnHeader}
        activeOpacity={canRename ? 0.7 : 1}
        disabled={!canRename}
        onPress={() => onPressColumnHeader?.(column)}
        accessibilityRole={canRename ? 'button' : 'header'}
        accessibilityLabel={
          canRename ? `${column.name}, ${renameColumnA11y}` : `${column.emoji} ${column.name}`
        }
      >
        <View style={styles.columnHeaderRow}>
          <Text style={styles.columnEmoji}>{column.emoji}</Text>
          <Text style={styles.columnTitle} numberOfLines={2}>
            {column.name}
          </Text>
          {taskCount > 0 ? (
            <Text style={styles.columnCountBadge}>{taskCount}</Text>
          ) : null}
          {canRename ? (
            <Pencil size={14} color={THEME.colors.text.tertiary} accessibilityElementsHidden />
          ) : null}
        </View>
      </TouchableOpacity>

      {column.isLoose ? (
        column.tasks.length > 0 ? (
          <View style={styles.tasks}>
            {column.tasks.map((task) => (
              <DraggablePlannerTask
                key={task.id}
                task={task}
                areas={areas}
                sourceDayId={column.id}
                compact
                onDragStart={onDragStart}
                onDragMove={onDragMove}
                onDragEnd={(taskId, sourceColumnId, x, y) => {
                  onDragEnd(taskId, sourceColumnId, x, y);
                }}
                onPressTask={onPressTask}
                onLongPressFallback={onPressTask ? () => onPressTask(task.id) : undefined}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyHint}>{emptyHint}</Text>
        )
      ) : (
        <View style={styles.projectGroups}>
          {column.projectGroups.length > 0 ? (
            column.projectGroups.map((group) => (
              <ProjectGroupSection
                key={group.id}
                group={group}
                column={column}
                areas={areas}
                emptyHint={emptyHint}
                onPressTask={onPressTask}
                onDragStart={onDragStart}
                onDragMove={onDragMove}
                onDragEnd={onDragEnd}
              />
            ))
          ) : (
            <Text style={styles.emptyHint}>{emptyHint}</Text>
          )}

          {canAddProject ? (
            <TouchableOpacity
              style={styles.addProjectBtn}
              onPress={() => onPressAddProject(column)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={addProjectLabel}
            >
              <Plus size={14} color={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.addProjectText}>{addProjectLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

export function BrainDumpAreaDragBoard({
  columns,
  areas,
  onMoveTask,
  onPressColumnHeader,
  onPressTask,
  onPressAddProject,
  emptyColumnHint,
  renameColumnA11y,
  addProjectLabel,
  hideEmptyColumns = true,
  dragHint,
  boardHint,
  splitLayout = true,
  looseSectionTitle,
  areasSectionTitle,
  areasFooter,
}: BrainDumpAreaDragBoardProps) {
  const columnLayouts = useRef<Map<string, ColumnLayout>>(new Map());
  const columnRefs = useRef<Map<string, View | null>>(new Map());
  const [hoverColumnId, setHoverColumnId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const isDragging = draggingTaskId != null;

  const { looseColumn, areaColumns } = useMemo(
    () => splitBrainDumpBoardColumns(columns),
    [columns],
  );

  const showLooseSection = useMemo(() => {
    if (!splitLayout || !looseColumn) return false;
    if (!hideEmptyColumns) return true;
    if (countTasksInColumn(looseColumn) > 0) return true;
    return isDragging;
  }, [splitLayout, looseColumn, hideEmptyColumns, isDragging]);

  const visibleAreaColumns = useMemo(() => {
    const source = splitLayout ? areaColumns : columns.filter((column) => !column.isLoose);
    if (!hideEmptyColumns) return source;
    if (isDragging) return source;
    return filterVisibleBrainDumpAreaColumns(source);
  }, [splitLayout, areaColumns, columns, hideEmptyColumns, isDragging]);

  const visibleColumns = useMemo(() => {
    if (!splitLayout) {
      if (!hideEmptyColumns) return columns;
      if (isDragging) return columns;
      return filterVisibleBrainDumpAreaColumns(columns);
    }
    const result: BrainDumpAreaColumn[] = [];
    if (showLooseSection && looseColumn) result.push(looseColumn);
    result.push(...visibleAreaColumns);
    return result;
  }, [
    splitLayout,
    columns,
    hideEmptyColumns,
    isDragging,
    showLooseSection,
    looseColumn,
    visibleAreaColumns,
  ]);

  const measureColumns = useCallback(() => {
    for (const column of visibleColumns) {
      const ref = columnRefs.current.get(column.id);
      ref?.measureInWindow((x, y, width, height) => {
        columnLayouts.current.set(column.id, { columnId: column.id, x, y, width, height });
      });
    }
  }, [visibleColumns]);

  const findDropColumn = useCallback((absoluteX: number, absoluteY: number): string | null => {
    for (const layoutEntry of columnLayouts.current.values()) {
      if (
        absoluteX >= layoutEntry.x &&
        absoluteX <= layoutEntry.x + layoutEntry.width &&
        absoluteY >= layoutEntry.y &&
        absoluteY <= layoutEntry.y + layoutEntry.height
      ) {
        return layoutEntry.columnId;
      }
    }
    return null;
  }, []);

  const handleDragStart = useCallback(
    (taskId: string) => {
      setDraggingTaskId(taskId);
      requestAnimationFrame(() => measureColumns());
    },
    [measureColumns],
  );

  useEffect(() => {
    if (!isDragging) return;
    const frame = requestAnimationFrame(() => measureColumns());
    return () => cancelAnimationFrame(frame);
  }, [isDragging, visibleColumns, measureColumns]);

  const handleDragMove = useCallback(
    (absoluteX: number, absoluteY: number) => {
      setHoverColumnId(findDropColumn(absoluteX, absoluteY));
    },
    [findDropColumn],
  );

  const handleDragEnd = useCallback(
    (taskId: string, sourceColumnId: string, absoluteX: number, absoluteY: number) => {
      const targetColumnId = findDropColumn(absoluteX, absoluteY);
      setHoverColumnId(null);
      setDraggingTaskId(null);

      if (!targetColumnId || targetColumnId === sourceColumnId) return;
      onMoveTask(taskId, targetColumnId);
    },
    [findDropColumn, onMoveTask],
  );

  const renderColumn = (column: BrainDumpAreaColumn) => {
    const isEmptyDropTarget =
      hideEmptyColumns && isDragging && countTasksInColumn(column) === 0;

    return (
      <AreaColumn
        key={column.id}
        column={column}
        areas={areas}
        compactDropTarget={isEmptyDropTarget}
        isHover={hoverColumnId === column.id && isDragging}
        emptyColumnHint={emptyColumnHint}
        renameColumnA11y={renameColumnA11y}
        addProjectLabel={addProjectLabel}
        onMeasure={measureColumns}
        columnRef={(node) => {
          if (node) columnRefs.current.set(column.id, node);
          else columnRefs.current.delete(column.id);
        }}
        onPressColumnHeader={onPressColumnHeader}
        onPressTask={onPressTask}
        onPressAddProject={onPressAddProject}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />
    );
  };

  return (
    <View style={styles.boardWrap} onLayout={measureColumns}>
      {!isDragging && boardHint ? <Text style={styles.boardHint}>{boardHint}</Text> : null}
      {isDragging && dragHint ? <Text style={styles.dragHint}>{dragHint}</Text> : null}

      {splitLayout ? (
        <>
          {showLooseSection && looseColumn ? (
            <View style={styles.section}>
              {looseSectionTitle ? (
                <Text style={styles.sectionTitle}>{looseSectionTitle}</Text>
              ) : null}
              {renderColumn(looseColumn)}
            </View>
          ) : null}

          <View style={styles.section}>
            {areasSectionTitle ? (
              <Text style={styles.sectionTitle}>{areasSectionTitle}</Text>
            ) : null}
            <View style={styles.board}>
              {visibleAreaColumns.map((column) => renderColumn(column))}
            </View>
            {areasFooter ? <View style={styles.sectionFooter}>{areasFooter}</View> : null}
          </View>
        </>
      ) : (
        <View style={styles.board}>{visibleColumns.map((column) => renderColumn(column))}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  boardWrap: {
    gap: THEME.spacing.md,
    alignSelf: 'stretch',
  },
  section: {
    gap: THEME.spacing.sm,
    alignSelf: 'stretch',
  },
  sectionTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  sectionFooter: {
    alignSelf: 'stretch',
  },
  dragHint: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  boardHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  board: {
    gap: THEME.spacing.sm,
    alignSelf: 'stretch',
  },
  column: {
    gap: THEME.spacing.xs,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  columnDropTarget: {
    minHeight: 52,
    justifyContent: 'center',
    borderStyle: 'dashed',
    backgroundColor: THEME.colors.calm.mist,
    paddingVertical: THEME.spacing.xs,
  },
  dropTargetHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    fontStyle: 'italic',
    lineHeight: 16,
    flexShrink: 0,
  },
  columnLoose: {
    backgroundColor: THEME.colors.fill[200],
  },
  columnHover: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
  },
  columnHeader: {
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
  columnEmoji: {
    fontSize: 16,
    lineHeight: 22,
  },
  columnTitle: {
    ...THEME.typography.body,
    flex: 1,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    letterSpacing: 0.2,
  },
  columnCountBadge: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    minWidth: 22,
    textAlign: 'center',
  },
  projectGroups: {
    gap: THEME.spacing.sm,
  },
  projectGroup: {
    gap: THEME.spacing.xs,
    padding: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
  },
  projectHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  projectName: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
  },
  projectDue: {
    ...THEME.typography.micro,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  looseGroupLabel: {
    ...THEME.typography.micro,
    color: THEME.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 2,
  },
  emptyHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    fontStyle: 'italic',
    lineHeight: 16,
    paddingHorizontal: 2,
  },
  emptyProjectHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    fontStyle: 'italic',
    lineHeight: 16,
    paddingHorizontal: 2,
  },
  tasks: {
    gap: THEME.spacing.xs,
  },
  addProjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  addProjectText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
});
