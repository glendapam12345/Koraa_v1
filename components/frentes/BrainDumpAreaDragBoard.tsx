import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type ScrollView } from 'react-native';
import { FolderKanban, Pencil, Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { DraggablePlannerTask } from '@/components/tasks/experience/DraggablePlannerTask';
import { applyDragEdgeAutoScroll } from '@/lib/dragEdgeAutoScroll';
import type { LifeArea } from '@/lib/lifeAreas/types';
import {
  columnHasSavedProjectGroups,
  countTasksInColumn,
  filterVisibleBrainDumpAreaColumns,
  splitBrainDumpBoardColumns,
  type BrainDumpAreaColumn,
  type BrainDumpProjectGroup,
} from '@/lib/review/buildBrainDumpAreaBoardModel';
import type { BrainDumpReviewProject } from '@/lib/review/brainDumpProjects';

type ColumnLayout = {
  columnId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type GroupLayout = {
  groupId: string;
  columnId: string;
  projectId: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
};

type DropTarget = {
  columnId: string;
  projectId: string | null;
};

const DROP_HIT_SLOP = 44;
const COLUMN_DROP_SLOP = 56;

function pointInLayout(
  absoluteX: number,
  absoluteY: number,
  layout: { x: number; y: number; width: number; height: number },
  slop = DROP_HIT_SLOP,
): boolean {
  if (layout.width <= 0 || layout.height <= 0) return false;
  return (
    absoluteX >= layout.x - slop &&
    absoluteX <= layout.x + layout.width + slop &&
    absoluteY >= layout.y - slop &&
    absoluteY <= layout.y + layout.height + slop
  );
}

type BrainDumpAreaDragBoardProps = {
  columns: BrainDumpAreaColumn[];
  areas: LifeArea[];
  projects?: BrainDumpReviewProject[];
  onMoveTask: (taskId: string, targetColumnId: string, targetProjectId?: string | null) => void;
  onPressColumnHeader?: (column: BrainDumpAreaColumn) => void;
  onPressTask?: (taskId: string) => void;
  onRequestMoveTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onPressAddProject?: (column: BrainDumpAreaColumn) => void;
  onPressDeleteProject?: (projectId: string, projectName: string) => void;
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
  betweenSections?: ReactNode;
  areasHeader?: ReactNode;
  areasFooter?: ReactNode;
  onMoveAreaColumn?: (ref: string, direction: 'up' | 'down') => void;
  canMoveAreaUp?: (ref: string) => boolean;
  canMoveAreaDown?: (ref: string) => boolean;
  moveAreaUpA11y?: string;
  moveAreaDownA11y?: string;
  reorderAreasLabel?: string;
  moveTaskLabel?: string;
  moveTaskA11y?: string;
  emptyAreaHint?: string;
  onDraggingChange?: (dragging: boolean) => void;
  parentScrollRef?: RefObject<ScrollView | null>;
  parentScrollYRef?: RefObject<number>;
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
  onRequestMoveTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onPressAddProject?: (column: BrainDumpAreaColumn) => void;
  onPressDeleteProject?: (projectId: string, projectName: string) => void;
  onMoveAreaColumn?: (ref: string, direction: 'up' | 'down') => void;
  canMoveAreaUp?: (ref: string) => boolean;
  canMoveAreaDown?: (ref: string) => boolean;
  moveAreaUpA11y?: string;
  moveAreaDownA11y?: string;
  reorderAreasLabel?: string;
  moveTaskLabel?: string;
  moveTaskA11y?: string;
  onDragStart: (taskId: string) => void;
  onDragMove: (absoluteX: number, absoluteY: number) => void;
  onDragEnd: (taskId: string, sourceColumnId: string, absoluteX: number, absoluteY: number) => void;
  onDragPrepare?: () => void;
  onDragRelease?: () => void;
};

function ProjectGroupSection({
  group,
  column,
  areas,
  emptyHint,
  onPressTask,
  onRequestMoveTask,
  onDeleteTask,
  onPressDeleteProject,
  moveTaskLabel,
  moveTaskA11y,
  groupRef,
  onMeasureGroup,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragPrepare,
  onDragRelease,
}: {
  group: BrainDumpProjectGroup;
  column: BrainDumpAreaColumn;
  areas: LifeArea[];
  emptyHint: string;
  onPressTask?: (taskId: string) => void;
  onRequestMoveTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onPressDeleteProject?: (projectId: string, projectName: string) => void;
  moveTaskLabel?: string;
  moveTaskA11y?: string;
  onMeasureGroup?: (group: BrainDumpProjectGroup, columnId: string) => void;
  groupRef?: (groupId: string, node: View | null) => void;
  onDragStart: (taskId: string) => void;
  onDragMove: (absoluteX: number, absoluteY: number) => void;
  onDragEnd: (taskId: string, sourceColumnId: string, absoluteX: number, absoluteY: number) => void;
  onDragPrepare?: () => void;
  onDragRelease?: () => void;
}) {
  const { t } = useI18n();
  const isLooseGroup = group.id.startsWith('loose-in-');

  return (
    <View
      ref={(node) => groupRef?.(group.id, node)}
      onLayout={() => onMeasureGroup?.(group, column.id)}
      style={styles.projectGroup}
    >
      {!isLooseGroup ? (
        <View style={styles.projectHeader}>
          <FolderKanban size={14} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.projectName}>
            {group.name}
          </Text>
          {group.dueDateLabel ? (
            <Text style={styles.projectDue}>
              {group.dueDateLabel}
            </Text>
          ) : null}
          {onPressDeleteProject ? (
            <TouchableOpacity
              onPress={() => onPressDeleteProject(group.id, group.name)}
              hitSlop={8}
              style={styles.projectDeleteBtn}
              accessibilityRole="button"
              accessibilityLabel={t('vaciar.areaReviewDeleteProjectA11y', { name: group.name })}
            >
              <Trash2 size={14} color={THEME.colors.semantic.danger} />
            </TouchableOpacity>
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
              dragMode="longPress"
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={(taskId, sourceColumnId, x, y) => {
                onDragEnd(taskId, sourceColumnId, x, y);
              }}
              onDragPrepare={onDragPrepare}
              onDragRelease={onDragRelease}
              onPressTask={onPressTask}
              onMovePress={
                onRequestMoveTask ? () => onRequestMoveTask(task.id) : undefined
              }
              onDeletePress={
                onDeleteTask ? () => onDeleteTask(task.id) : undefined
              }
              deleteA11yLabel={t('vaciar.previewDeleteTaskA11y')}
              moveA11yLabel={moveTaskA11y ?? t('vaciar.areaReviewMoveTaskA11y')}
              moveButtonLabel={moveTaskLabel}
              onLongPressFallback={
                onRequestMoveTask
                  ? () => onRequestMoveTask(task.id)
                  : onPressTask
                    ? () => onPressTask(task.id)
                    : undefined
              }
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
  onRequestMoveTask,
  onDeleteTask,
  onPressAddProject,
  onPressDeleteProject,
  onMoveAreaColumn,
  canMoveAreaUp,
  canMoveAreaDown,
  moveAreaUpA11y,
  moveAreaDownA11y,
  reorderAreasLabel,
  moveTaskLabel,
  moveTaskA11y,
  onMeasureGroup,
  groupRef,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragPrepare,
  onDragRelease,
}: AreaColumnProps & {
  onMeasureGroup?: (group: BrainDumpProjectGroup, columnId: string) => void;
  groupRef?: (groupId: string, node: View | null) => void;
}) {
  const { t } = useI18n();
  const canRename = !column.isLoose && onPressColumnHeader;
  const canReorder = !column.isLoose && column.ref && onMoveAreaColumn;
  const taskCount = countTasksInColumn(column);
  const canAddProject = !column.isLoose && column.ref && onPressAddProject && !compactDropTarget;

  if (compactDropTarget) {
    return (
      <View
        ref={columnRef}
        onLayout={onMeasure}
        style={[
          styles.column,
          { borderLeftColor: column.color },
          styles.columnDropTarget,
          isHover ? styles.columnHover : null,
        ]}
      >
        <View style={styles.columnHeader}>
          <TouchableOpacity
            style={styles.columnHeaderMain}
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
              <Text style={styles.columnTitle}>{column.name}</Text>
              <Text style={styles.dropTargetHint}>{emptyHint}</Text>
            </View>
          </TouchableOpacity>
          {canReorder && column.ref ? (
            <View style={styles.reorderControls}>
              {reorderAreasLabel ? (
                <Text style={styles.reorderLabel}>{reorderAreasLabel}</Text>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.reorderBtn,
                  !(canMoveAreaUp?.(column.ref) ?? false) && styles.reorderBtnDisabled,
                ]}
                onPress={() => onMoveAreaColumn(column.ref!, 'up')}
                disabled={!(canMoveAreaUp?.(column.ref) ?? false)}
                accessibilityRole="button"
                accessibilityLabel={moveAreaUpA11y ?? 'Subir área'}
              >
                <ChevronUp size={16} color={THEME.colors.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.reorderBtn,
                  !(canMoveAreaDown?.(column.ref) ?? false) && styles.reorderBtnDisabled,
                ]}
                onPress={() => onMoveAreaColumn(column.ref!, 'down')}
                disabled={!(canMoveAreaDown?.(column.ref) ?? false)}
                accessibilityRole="button"
                accessibilityLabel={moveAreaDownA11y ?? 'Bajar área'}
              >
                <ChevronDown size={16} color={THEME.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          ) : null}
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
        { borderLeftColor: column.color, borderColor: `${column.color}55` },
        column.isLoose ? styles.columnLoose : null,
        isHover ? styles.columnHover : null,
      ]}
    >
      <View
        style={[
          styles.columnHeader,
          { backgroundColor: column.isLoose ? THEME.colors.calm.mist : `${column.color}22` },
        ]}
      >
        <TouchableOpacity
          style={styles.columnHeaderMain}
          activeOpacity={canRename ? 0.7 : 1}
          disabled={!canRename}
          onPress={() => onPressColumnHeader?.(column)}
          accessibilityRole={canRename ? 'button' : 'header'}
          accessibilityLabel={
            canRename ? `${column.name}, ${renameColumnA11y}` : `${column.emoji} ${column.name}`
          }
        >
          <View style={styles.columnHeaderRow}>
            {!column.isLoose ? (
              <View style={[styles.columnColorDot, { backgroundColor: column.color }]} />
            ) : null}
            <Text style={styles.columnEmoji}>{column.emoji}</Text>
            <Text style={styles.columnTitle}>{column.name}</Text>
            {taskCount > 0 ? (
              <Text style={styles.columnCountBadge}>{taskCount}</Text>
            ) : null}
            {canRename ? (
              <Pencil size={14} color={THEME.colors.text.tertiary} accessibilityElementsHidden />
            ) : null}
          </View>
        </TouchableOpacity>
        {canReorder && column.ref ? (
          <View style={styles.reorderControls}>
            {reorderAreasLabel ? (
              <Text style={styles.reorderLabel}>{reorderAreasLabel}</Text>
            ) : null}
            <TouchableOpacity
              style={[
                styles.reorderBtn,
                !(canMoveAreaUp?.(column.ref) ?? false) && styles.reorderBtnDisabled,
              ]}
              onPress={() => onMoveAreaColumn(column.ref!, 'up')}
              disabled={!(canMoveAreaUp?.(column.ref) ?? false)}
              accessibilityRole="button"
              accessibilityLabel={moveAreaUpA11y ?? 'Subir área'}
            >
              <ChevronUp size={16} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.reorderBtn,
                !(canMoveAreaDown?.(column.ref) ?? false) && styles.reorderBtnDisabled,
              ]}
              onPress={() => onMoveAreaColumn(column.ref!, 'down')}
              disabled={!(canMoveAreaDown?.(column.ref) ?? false)}
              accessibilityRole="button"
              accessibilityLabel={moveAreaDownA11y ?? 'Bajar área'}
            >
              <ChevronDown size={16} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

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
                dragMode="longPress"
                onDragStart={onDragStart}
                onDragMove={onDragMove}
                onDragEnd={onDragEnd}
                onDragPrepare={onDragPrepare}
                onDragRelease={onDragRelease}
                onPressTask={onPressTask}
                onMovePress={
                  onRequestMoveTask ? () => onRequestMoveTask(task.id) : undefined
                }
                onDeletePress={
                  onDeleteTask ? () => onDeleteTask(task.id) : undefined
                }
                deleteA11yLabel={t('vaciar.previewDeleteTaskA11y')}
                onLongPressFallback={
                  onRequestMoveTask
                    ? () => onRequestMoveTask(task.id)
                    : onPressTask
                      ? () => onPressTask(task.id)
                      : undefined
                }
                moveA11yLabel={moveTaskA11y ?? t('vaciar.areaReviewMoveTaskA11y')}
                moveButtonLabel={moveTaskLabel}
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
                onRequestMoveTask={onRequestMoveTask}
                onDeleteTask={onDeleteTask}
                onPressDeleteProject={onPressDeleteProject}
                moveTaskLabel={moveTaskLabel}
                moveTaskA11y={moveTaskA11y}
                groupRef={groupRef}
                onMeasureGroup={onMeasureGroup}
                onDragStart={onDragStart}
                onDragMove={onDragMove}
                onDragEnd={onDragEnd}
                onDragPrepare={onDragPrepare}
                onDragRelease={onDragRelease}
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
              <View style={styles.addProjectInner}>
                <Plus size={14} color={THEME.colors.calm.lavenderDeep} />
                <Text style={styles.addProjectText}>{addProjectLabel}</Text>
              </View>
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
  projects = [],
  onMoveTask,
  onPressColumnHeader,
  onPressTask,
  onRequestMoveTask,
  onDeleteTask,
  onPressAddProject,
  onPressDeleteProject,
  emptyColumnHint,
  renameColumnA11y,
  addProjectLabel,
  hideEmptyColumns = true,
  dragHint,
  boardHint,
  splitLayout = true,
  looseSectionTitle,
  areasSectionTitle,
  betweenSections,
  areasHeader,
  areasFooter,
  onMoveAreaColumn,
  canMoveAreaUp,
  canMoveAreaDown,
  moveAreaUpA11y,
  moveAreaDownA11y,
  reorderAreasLabel,
  moveTaskLabel,
  moveTaskA11y,
  emptyAreaHint,
  onDraggingChange,
  parentScrollRef,
  parentScrollYRef,
}: BrainDumpAreaDragBoardProps) {
  const columnLayouts = useRef<Map<string, ColumnLayout>>(new Map());
  const groupLayouts = useRef<Map<string, GroupLayout>>(new Map());
  const columnRefs = useRef<Map<string, View | null>>(new Map());
  const groupRefs = useRef<Map<string, View | null>>(new Map());
  const hoverTargetRef = useRef<DropTarget | null>(null);
  const lastRemeasureAtRef = useRef(0);
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
    // Siempre mostrar áreas (aunque vacías) para que se vean los destinos al mover.
    return source;
  }, [splitLayout, areaColumns, columns]);

  const visibleColumns = useMemo(() => {
    if (!splitLayout) {
      if (!hideEmptyColumns) return columns;
      if (isDragging) return columns;
      return filterVisibleBrainDumpAreaColumns(columns, projects);
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
    projects,
  ]);

  const measureColumns = useCallback(() => {
    for (const column of visibleColumns) {
      const ref = columnRefs.current.get(column.id);
      ref?.measureInWindow((x, y, width, height) => {
        columnLayouts.current.set(column.id, { columnId: column.id, x, y, width, height });
      });
    }
  }, [visibleColumns]);

  const measureGroups = useCallback(() => {
    for (const [groupId, ref] of groupRefs.current.entries()) {
      ref?.measureInWindow((x, y, width, height) => {
        const existing = groupLayouts.current.get(groupId);
        if (!existing) return;
        groupLayouts.current.set(groupId, { ...existing, x, y, width, height });
      });
    }
  }, []);

  const measureDropTargets = useCallback(() => {
    measureColumns();
    measureGroups();
  }, [measureColumns, measureGroups]);

  const registerGroup = useCallback((group: BrainDumpProjectGroup, columnId: string) => {
    const isLooseGroup = group.id.startsWith('loose-in-');
    const layout: GroupLayout = {
      groupId: group.id,
      columnId,
      projectId: isLooseGroup ? null : group.id,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    groupLayouts.current.set(group.id, layout);
    const ref = groupRefs.current.get(group.id);
    ref?.measureInWindow((x, y, width, height) => {
      groupLayouts.current.set(group.id, { ...layout, x, y, width, height });
    });
  }, []);

  const findDropTarget = useCallback((absoluteX: number, absoluteY: number): DropTarget | null => {
    let matchedColumn: ColumnLayout | null = null;
    for (const layoutEntry of columnLayouts.current.values()) {
      if (pointInLayout(absoluteX, absoluteY, layoutEntry, COLUMN_DROP_SLOP)) {
        matchedColumn = layoutEntry;
        break;
      }
    }
    if (!matchedColumn) return null;

    for (const layoutEntry of groupLayouts.current.values()) {
      if (layoutEntry.columnId !== matchedColumn.columnId) continue;
      if (pointInLayout(absoluteX, absoluteY, layoutEntry, DROP_HIT_SLOP)) {
        return { columnId: layoutEntry.columnId, projectId: layoutEntry.projectId };
      }
    }

    return { columnId: matchedColumn.columnId, projectId: null };
  }, []);

  const handleDragPrepare = useCallback(() => {
    onDraggingChange?.(true);
  }, [onDraggingChange]);

  const handleDragRelease = useCallback(() => {
    onDraggingChange?.(false);
  }, [onDraggingChange]);

  const handleDragStart = useCallback(
    (taskId: string) => {
      hoverTargetRef.current = null;
      setDraggingTaskId(taskId);
      requestAnimationFrame(() => {
        measureDropTargets();
        requestAnimationFrame(measureDropTargets);
      });
    },
    [measureDropTargets],
  );

  const maybeRemeasureAfterScroll = useCallback(() => {
    const now = Date.now();
    if (now - lastRemeasureAtRef.current < 48) return;
    lastRemeasureAtRef.current = now;
    measureDropTargets();
  }, [measureDropTargets]);

  useEffect(() => {
    if (!isDragging) return;
    const frame = requestAnimationFrame(() => measureDropTargets());
    return () => cancelAnimationFrame(frame);
  }, [isDragging, visibleColumns, measureDropTargets]);

  const handleDragMove = useCallback(
    (absoluteX: number, absoluteY: number) => {
      if (parentScrollRef?.current && parentScrollYRef) {
        const nextY = applyDragEdgeAutoScroll(
          parentScrollRef.current,
          parentScrollYRef.current,
          absoluteY,
          { edge: 110, step: 32, topInset: 120 },
        );
        if (nextY !== parentScrollYRef.current) {
          parentScrollYRef.current = nextY;
          maybeRemeasureAfterScroll();
        }
      }

      const target = findDropTarget(absoluteX, absoluteY);
      hoverTargetRef.current = target;
      const nextColumnId = target?.columnId ?? null;
      setHoverColumnId((current) => (current === nextColumnId ? current : nextColumnId));
    },
    [findDropTarget, maybeRemeasureAfterScroll, parentScrollRef, parentScrollYRef],
  );

  const handleDragEnd = useCallback(
    (taskId: string, _sourceColumnId: string, absoluteX: number, absoluteY: number) => {
      const target =
        hoverTargetRef.current ?? findDropTarget(absoluteX, absoluteY);
      hoverTargetRef.current = null;
      setHoverColumnId(null);
      setDraggingTaskId(null);

      if (!target) return;
      onMoveTask(taskId, target.columnId, target.projectId);
    },
    [findDropTarget, onMoveTask],
  );

  const renderColumn = (column: BrainDumpAreaColumn) => {
    const isEmptyArea =
      !column.isLoose &&
      countTasksInColumn(column) === 0 &&
      !columnHasSavedProjectGroups(column);

    return (
      <AreaColumn
        key={column.id}
        column={column}
        areas={areas}
        compactDropTarget={isEmptyArea}
        isHover={hoverColumnId === column.id && isDragging}
        emptyColumnHint={
          isEmptyArea && !isDragging
            ? (emptyAreaHint ?? emptyColumnHint)
            : emptyColumnHint
        }
        renameColumnA11y={renameColumnA11y}
        addProjectLabel={addProjectLabel}
        onMeasure={measureDropTargets}
        columnRef={(node) => {
          if (node) columnRefs.current.set(column.id, node);
          else columnRefs.current.delete(column.id);
        }}
        groupRef={(groupId, node) => {
          if (node) groupRefs.current.set(groupId, node);
          else groupRefs.current.delete(groupId);
        }}
        onMeasureGroup={registerGroup}
        onPressColumnHeader={onPressColumnHeader}
        onPressTask={onPressTask}
        onRequestMoveTask={onRequestMoveTask}
        onDeleteTask={onDeleteTask}
        onPressAddProject={onPressAddProject}
        onPressDeleteProject={onPressDeleteProject}
        onMoveAreaColumn={onMoveAreaColumn}
        canMoveAreaUp={canMoveAreaUp}
        canMoveAreaDown={canMoveAreaDown}
        moveAreaUpA11y={moveAreaUpA11y}
        moveAreaDownA11y={moveAreaDownA11y}
        reorderAreasLabel={reorderAreasLabel}
        moveTaskLabel={moveTaskLabel}
        moveTaskA11y={moveTaskA11y}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragPrepare={handleDragPrepare}
        onDragRelease={handleDragRelease}
      />
    );
  };

  return (
    <View style={styles.boardWrap} onLayout={measureDropTargets}>
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

          {betweenSections ?? areasHeader ? (
            <View style={styles.sectionHeader}>{betweenSections ?? areasHeader}</View>
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
  sectionHeader: {
    alignSelf: 'stretch',
  },
  reorderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: THEME.spacing.xs,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: THEME.colors.calm.border,
  },
  reorderLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    fontFamily: THEME.fonts.heading.medium,
    marginRight: 2,
    lineHeight: 16,
  },
  reorderBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.borderRadius.standard,
  },
  reorderBtnDisabled: {
    opacity: 0.35,
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
    borderLeftWidth: 3,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    overflow: 'hidden',
    alignSelf: 'stretch',
    ...THEME.shadows.soft,
  },
  columnDropTarget: {
    minHeight: 96,
    justifyContent: 'center',
    borderStyle: 'dashed',
    backgroundColor: THEME.colors.calm.mist,
    paddingVertical: THEME.spacing.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingHorizontal: 2,
    paddingVertical: THEME.spacing.xs,
    marginBottom: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
    borderRadius: THEME.borderRadius.standard,
  },
  columnColorDot: {
    width: THEME.spacing.xs,
    height: THEME.spacing.xs,
    borderRadius: THEME.spacing.xs / 2,
    flexShrink: 0,
  },
  columnHeaderMain: {
    flex: 1,
    minWidth: 0,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  columnHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.xs,
  },
  columnEmoji: {
    ...THEME.typography.displayEmojiSm,
    flexShrink: 0,
  },
  columnTitle: {
    ...THEME.typography.body,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    letterSpacing: 0.2,
    lineHeight: 22,
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
    flexShrink: 1,
    minWidth: 0,
    lineHeight: 18,
  },
  projectDue: {
    ...THEME.typography.micro,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    flexShrink: 1,
    lineHeight: 14,
  },
  projectDeleteBtn: {
    padding: 4,
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
    alignSelf: 'stretch',
    minHeight: 40,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: THEME.colors.calm.lavenderDeep,
    justifyContent: 'center',
  },
  addProjectInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  addProjectText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    textAlign: 'center',
    lineHeight: 18,
  },
});
