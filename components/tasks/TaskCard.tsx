import { useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { THEME } from '@/constants/theme';
import { getCategoryEmoji } from '@/constants/emojis';
import { ChevronDown, ChevronRight, Check, Pencil, Trash2, Calendar } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { categoryLabel } from '@/lib/i18n/categoryLabels';

const MONTH_KEYS = [
  'taskCard.monthJan',
  'taskCard.monthFeb',
  'taskCard.monthMar',
  'taskCard.monthApr',
  'taskCard.monthMay',
  'taskCard.monthJun',
  'taskCard.monthJul',
  'taskCard.monthAug',
  'taskCard.monthSep',
  'taskCard.monthOct',
  'taskCard.monthNov',
  'taskCard.monthDec',
] as const;

function formatTaskDate(
  iso: string | null | undefined,
  t: (key: (typeof MONTH_KEYS)[number]) => string,
): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const day = d.getDate();
    const month = t(MONTH_KEYS[d.getMonth()]);
    return `${day} ${month}`;
  } catch {
    return '';
  }
}

export interface Task {
  id: string;
  content: string;
  is_completed: boolean;
  is_priority: boolean;
  category: string;
  completed_at: string | null;
  created_at: string;
  subtasks?: Task[];
  parent_task_id: string | null;
  project_id?: string | null;
  scheduled_date?: string | null;
}

interface TaskCardProps {
  task: Task;
  index: number;
  expanded: boolean;
  /** Panel de especificaciones (categoría, prioridad, proyecto) expandido */
  expandedDetails?: boolean;
  onToggleDetailsExpand?: () => void;
  menuOpen: boolean;
  onToggle: () => void;
  onToggleExpansion: () => void;
  onMenuPress: () => void;
  onEditTask: () => void;
  onDeleteTask: () => void;
  getCategoryColor: (category: string) => string;
  onSubtaskToggle: (subtaskId: string) => void;
  /** Etiqueta: "Mi lista", "Parte de [proyecto]" o nombre del proyecto; color del proyecto */
  projectLabel?: string | null;
  projectLabelColor?: string;
  projectId?: string | null;
  /** Nombre del proyecto para leyenda "Pertenece a X" */
  projectName?: string | null;
  onPressProject?: () => void;
  /** Otras tareas del mismo proyecto (siguientes pasos) */
  projectSteps?: Task[];
  expandedProjectSteps?: boolean;
  onToggleProjectSteps?: () => void;
  /** Para marcar completada una tarea (p. ej. desde pasos del proyecto) */
  onToggleTask?: (taskId: string) => void;
  hideProjectLabel?: boolean;
  sectionAccentColor?: string;
  /** Categoría de la sección: si coincide con task.category, ocultar chip redundante */
  sectionCategory?: string;
  /** Tarjeta uniforme: leyenda solo si proyecto "Pertenece a X"; si no, nada */
  uniformCard?: boolean;
  /** Por qué Koraa subió esta tarea en prioridad (check-in del día). */
  priorityWhyUp?: string[];
  /** Por qué quedó más abajo (tareas cercanas al foco del día). */
  priorityWhyDown?: string[];
}

export function TaskCard({
  task,
  index,
  expanded,
  expandedDetails = false,
  onToggleDetailsExpand,
  menuOpen,
  onToggle,
  onToggleExpansion,
  onMenuPress,
  onEditTask,
  onDeleteTask,
  getCategoryColor,
  onSubtaskToggle,
  projectLabel,
  projectLabelColor,
  projectId,
  projectName,
  onPressProject,
  projectSteps,
  expandedProjectSteps = false,
  onToggleProjectSteps,
  onToggleTask,
  hideProjectLabel,
  sectionAccentColor,
  sectionCategory,
  uniformCard = false,
  priorityWhyUp,
  priorityWhyDown,
}: TaskCardProps) {
  const { t, locale } = useI18n();
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter((st) => st.is_completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const isProjectTask = task.project_id !== null && task.project_id !== undefined;
  const hasProjectSteps = projectSteps && projectSteps.length > 0;
  /** En modo uniforme: solo mostrar leyenda si pertenece a un proyecto; si no, nada */
  const showProjectLegend = uniformCard && projectName != null && projectName !== '';
  const showLabel = !uniformCard && !hideProjectLabel && projectLabel != null && projectLabel !== '';
  const looseLabels = useMemo(
    () =>
      new Set([
        t('components.looseTasks'),
        t('components.myList'),
        'Tareas sueltas',
        'Mi lista',
        'Suelta',
        'Independiente',
        'Loose tasks',
        'My list',
      ]),
    [t],
  );
  const isLooseTask = showLabel && projectLabel != null && looseLabels.has(projectLabel);
  const contextDisplayText = isLooseTask ? t('components.looseTasks') : (projectLabel ?? '');
  const showVerProyecto = Boolean(projectId && onPressProject);
  const hasPriorityWhyDown = (priorityWhyDown?.length ?? 0) > 0;
  const hasDetails =
    onToggleDetailsExpand && (task.category || task.is_priority || projectLabel || hasPriorityWhyDown);
  const categoryEmoji = getCategoryEmoji(task.category);
  const sectionEmoji = isLooseTask ? '📋' : '📁';
  const scheduledLabel = task.scheduled_date ? formatTaskDate(task.scheduled_date, t) : '';
  const completedLabel = task.is_completed && task.completed_at ? formatTaskDate(task.completed_at, t) : '';
  const showDate = scheduledLabel || completedLabel;
  const taskContentLabel = task.content?.trim() || t('taskCard.taskFallback');
  const dateLine =
    task.is_completed && completedLabel
      ? t('taskCard.completedOn', { date: completedLabel })
      : scheduledLabel
        ? t('taskCard.scheduledFor', { date: scheduledLabel })
        : '';

  const cardLeftBorderColor = !uniformCard && !hideProjectLabel && isProjectTask && projectLabelColor
    ? projectLabelColor
    : undefined;
  const cardLeftBorderWidth = cardLeftBorderColor ? 5 : 0;

  const swipeableRef = useRef<Swipeable>(null);

  const handleSwipeAction = (fn: () => void) => {
    swipeableRef.current?.close();
    fn();
  };

  const renderRightActions = () => (
    <View style={styles.swipeActionsRow}>
      <RectButton
        style={[styles.swipeActionBtn, styles.swipeActionBtnWide, styles.swipeActionComplete]}
        onPress={() => handleSwipeAction(onToggle)}
        accessibilityRole="button"
        accessibilityLabel={
          task.is_completed
            ? t('taskCard.markPending', { task: taskContentLabel })
            : t('taskCard.markComplete', { task: taskContentLabel })
        }
      >
        <Check size={22} color={THEME.colors.fill[100]} strokeWidth={2.5} />
        <Text style={styles.swipeActionLabel} numberOfLines={1}>
          {task.is_completed ? t('taskCard.pending') : t('taskCard.complete')}
        </Text>
      </RectButton>
      <RectButton
        style={[styles.swipeActionBtn, styles.swipeActionEdit]}
        onPress={() => handleSwipeAction(onEditTask)}
        accessibilityRole="button"
        accessibilityLabel={t('taskCard.editTask', { task: taskContentLabel })}
      >
        <Pencil size={20} color={THEME.colors.fill[100]} strokeWidth={2} />
        <Text style={styles.swipeActionLabel} numberOfLines={1}>{t('taskCard.edit')}</Text>
      </RectButton>
      <RectButton
        style={[styles.swipeActionBtn, styles.swipeActionDelete]}
        onPress={() => handleSwipeAction(onDeleteTask)}
        accessibilityRole="button"
        accessibilityLabel={t('taskCard.deleteTask', { task: taskContentLabel })}
      >
        <Trash2 size={20} color={THEME.colors.fill[100]} strokeWidth={2} />
        <Text style={styles.swipeActionLabel} numberOfLines={1}>{t('taskCard.delete')}</Text>
      </RectButton>
    </View>
  );

  return (
    <View style={styles.taskWrapper}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        friction={2}
        rightThreshold={40}
        overshootRight={false}
      >
        <View
          style={[
            styles.taskCard,
          task.is_completed && styles.taskCardCompleted,
          cardLeftBorderColor ? [styles.taskCardProject, { borderLeftColor: cardLeftBorderColor, borderLeftWidth: cardLeftBorderWidth }] : styles.taskCardSuelta,
          uniformCard && styles.taskCardAligned,
        ]}
      >
        {task.is_priority && !task.is_completed && !uniformCard && (
          <View style={styles.priorityNumberContainer}>
            <View style={styles.priorityNumber}>
              <Text style={styles.priorityNumberText}>{index + 1}</Text>
            </View>
          </View>
        )}

        <View style={[styles.leftColumn, uniformCard && styles.leftColumnAligned]}>
          {hasSubtasks && !uniformCard ? (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={onToggleExpansion}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel={expanded ? t('taskCard.collapseSubtasks') : t('taskCard.expandSubtasks')}
            >
              {expanded ? (
                <ChevronDown size={20} color={THEME.colors.text.secondary} />
              ) : (
                <ChevronRight size={20} color={THEME.colors.text.secondary} />
              )}
            </TouchableOpacity>
          ) : (
            !uniformCard && <View style={styles.expandPlaceholder} />
          )}
          <TouchableOpacity
            style={[styles.taskCheckbox, uniformCard && styles.taskCheckboxAligned]}
            onPress={onToggle}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: task.is_completed }}
            accessibilityLabel={
              task.is_completed
                ? t('taskCard.markPendingA11y', { task: taskContentLabel })
                : t('taskCard.markCompleted', { task: taskContentLabel })
            }
          >
            {task.is_completed && <View style={styles.taskCheckboxChecked} />}
          </TouchableOpacity>
        </View>

        <View style={[styles.taskContent, uniformCard && styles.taskContentAligned]}>
          <View style={styles.taskTitleRow}>
            <TouchableOpacity
              style={styles.taskTextTouchable}
              onPress={onEditTask}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 0, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('taskCard.editTask', { task: taskContentLabel })}
            >
              <Text
                style={[styles.taskText, task.is_completed && styles.taskTextCompleted]}
                numberOfLines={2}
              >
                {task.content}
              </Text>
            </TouchableOpacity>
            {!uniformCard && task.category && task.category.trim() !== '' && !task.is_completed && 
             (!sectionCategory || task.category.toLowerCase() !== sectionCategory.toLowerCase()) && (
              <View style={[styles.categoryChip, { backgroundColor: getCategoryColor(task.category) + '22' }]}>
                <Text style={styles.categoryChipEmoji}>{categoryEmoji}</Text>
                <Text style={[styles.categoryChipText, { color: getCategoryColor(task.category) }]} numberOfLines={1}>
                  {categoryLabel(locale, task.category)}
                </Text>
              </View>
            )}
          </View>
          {(priorityWhyUp?.length ?? 0) > 0 && (
            <View
              style={styles.priorityWhyBlock}
              accessibilityRole="text"
              accessibilityLabel={`${t('hoy.taskWhyUp')}: ${priorityWhyUp!.join('. ')}`}
            >
              <Text style={styles.priorityWhyLabel}>{t('hoy.taskWhyUp')}</Text>
              {priorityWhyUp!.map((line, i) => (
                <Text key={`up-${i}`} style={styles.priorityWhyLine}>
                  • {line}
                </Text>
              ))}
            </View>
          )}
          {uniformCard ? (
            <View style={styles.metaRowSimple}>
              {showDate ? (
                <View style={styles.dateChip}>
                  <Calendar size={12} color={THEME.colors.text.secondary} />
                  <Text style={styles.dateChipText} numberOfLines={1}>
                    {dateLine}
                  </Text>
                </View>
              ) : null}
              {showProjectLegend && (
                <Text style={styles.metaLine} numberOfLines={1}>
                  {projectName}
                </Text>
              )}
              {hasSubtasks && !showProjectLegend && (
                <Text style={styles.metaLine} numberOfLines={1}>
                  {t('taskCard.stepsProgress', { done: completedSubtasks, total: totalSubtasks })}
                </Text>
              )}
              {(showProjectLegend || hasDetails || hasProjectSteps || hasSubtasks) && onToggleDetailsExpand && (
                <TouchableOpacity
                  style={styles.verMasRow}
                  onPress={onToggleDetailsExpand}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel={expandedDetails ? t('taskCard.hideDetails') : t('taskCard.showDetails')}
                >
                  <Text style={styles.verMasText}>
                    {expandedDetails ? t('taskCard.hideDetails') : t('taskCard.showDetails')}
                  </Text>
                  {expandedDetails ? (
                    <ChevronDown size={16} color={THEME.colors.text.secondary} />
                  ) : (
                    <ChevronRight size={16} color={THEME.colors.text.secondary} />
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.metaRow}>
              {showLabel && (
                isLooseTask ? (
                  <View style={[styles.contextBadge, styles.contextBadgeSueltas]}>
                    <Text style={styles.contextBadgeEmoji}>{sectionEmoji}</Text>
                    <Text style={styles.contextBadgeTextSueltas} numberOfLines={1}>
                      {t('components.looseTasks')}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.contextBadge, { borderLeftColor: projectLabelColor ?? THEME.colors.gradient.blue, backgroundColor: (projectLabelColor ?? THEME.colors.gradient.blue) + '18' }]}>
                    <Text style={styles.contextBadgeEmoji}>{sectionEmoji}</Text>
                    <Text
                      style={[styles.contextBadgeText, { color: projectLabelColor ?? THEME.colors.gradient.blue }]}
                      numberOfLines={1}
                    >
                      {contextDisplayText}
                    </Text>
                  </View>
                )
              )}
              {showDate ? (
                <View style={styles.dateChip}>
                  <Calendar size={12} color={THEME.colors.text.secondary} />
                  <Text style={styles.dateChipText} numberOfLines={1}>
                    {dateLine}
                  </Text>
                </View>
              ) : null}
              {hasSubtasks && (
                <View style={styles.subtasksPill}>
                  <Text style={styles.subtasksPillText}>
                    {completedSubtasks}/{totalSubtasks}
                  </Text>
                </View>
              )}
              {hasProjectSteps && onToggleProjectSteps && (
                <TouchableOpacity
                  style={styles.verPasosRow}
                  onPress={onToggleProjectSteps}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={
                    expandedProjectSteps
                      ? t('taskCard.hideSteps')
                      : t('taskCard.showSteps', { count: projectSteps!.length })
                  }
                >
                  <Text style={[styles.verPasosText, { color: projectLabelColor ?? THEME.colors.gradient.blue }]}>
                    {expandedProjectSteps
                      ? t('taskCard.hideSteps')
                      : t('taskCard.showSteps', { count: projectSteps!.length })}
                  </Text>
                  {expandedProjectSteps ? (
                    <ChevronDown size={16} color={projectLabelColor ?? THEME.colors.gradient.blue} />
                  ) : (
                    <ChevronRight size={16} color={projectLabelColor ?? THEME.colors.gradient.blue} />
                  )}
                </TouchableOpacity>
              )}
              {hasDetails && (
                <TouchableOpacity
                  style={styles.detailsToggleRow}
                  onPress={onToggleDetailsExpand}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel={expandedDetails ? t('taskCard.hideDetails') : t('taskCard.showDetails')}
                >
                  <Text style={styles.detailsToggleText} numberOfLines={1}>
                    {expandedDetails ? t('taskCard.hideDetails') : t('taskCard.showDetails')}
                  </Text>
                  {expandedDetails ? (
                    <ChevronDown size={14} color={THEME.colors.text.secondary} />
                  ) : (
                    <ChevronRight size={14} color={THEME.colors.text.secondary} />
                  )}
                </TouchableOpacity>
              )}
              {showVerProyecto && (
                <TouchableOpacity
                  style={styles.verProyectoLink}
                  onPress={onPressProject}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('taskCard.viewProject')}
                >
                  <Text style={[styles.verProyectoLinkText, projectLabelColor ? { color: projectLabelColor } : undefined]}>
                    {t('taskCard.viewProjectArrow')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {!uniformCard && hasSubtasks && (
            <View style={styles.subtasksProgressContainer}>
              <View style={styles.subtasksProgressBar}>
                <View
                  style={[
                    styles.subtasksProgressFill,
                    { width: `${(completedSubtasks / totalSubtasks) * 100}%` },
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      </View>
      </Swipeable>

      {expandedDetails && hasDetails && (
        <View style={styles.detailsPanel}>
          <Text style={styles.detailsPanelTitle}>{t('taskCardExtra.detailsTitle')}</Text>
          {task.category && (!sectionCategory || task.category.toLowerCase().trim() !== sectionCategory.toLowerCase()) ? (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>{t('taskCardExtra.category')}</Text>
              <View style={[styles.detailsChip, { backgroundColor: getCategoryColor(task.category) + '28' }]}>
                <Text style={styles.detailsChipEmoji}>{getCategoryEmoji(task.category)}</Text>
                <Text style={[styles.detailsChipText, { color: getCategoryColor(task.category) }]} numberOfLines={1}>
                  {categoryLabel(locale, task.category)}
                </Text>
              </View>
            </View>
          ) : null}
          {task.is_priority && !task.is_completed && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>{t('taskCardExtra.priority')}</Text>
              <View style={[styles.detailsChip, { backgroundColor: THEME.colors.gradient.blue + '28' }]}>
                <Text style={[styles.detailsChipText, { color: THEME.colors.gradient.blue }]}>
                  {t('taskCardExtra.priorityHigh')}
                </Text>
              </View>
            </View>
          )}
          {(projectLabel || contextDisplayText) && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>{t('taskCardExtra.context')}</Text>
              <View
                style={[
                  styles.detailsChip,
                  { backgroundColor: (isLooseTask ? THEME.colors.text.secondary : (projectLabelColor ?? THEME.colors.gradient.blue)) + '28' },
                ]}
              >
                <Text
                  style={[styles.detailsChipText, { color: isLooseTask ? THEME.colors.text.secondary : (projectLabelColor ?? THEME.colors.gradient.blue) }]}
                  numberOfLines={1}
                >
                  {contextDisplayText}
                </Text>
              </View>
            </View>
          )}
          {hasPriorityWhyDown && (
            <View
              style={styles.priorityWhyBlockDown}
              accessibilityRole="text"
              accessibilityLabel={`${t('hoy.taskWhyDown')}: ${priorityWhyDown!.join('. ')}`}
            >
              <Text style={styles.priorityWhyLabelDown}>{t('hoy.taskWhyDown')}</Text>
              {priorityWhyDown!.map((line, i) => (
                <Text key={`down-${i}`} style={styles.priorityWhyLineDown}>
                  • {line}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {(expanded || (uniformCard && expandedDetails)) && hasSubtasks && (
        <View style={styles.subtasksContainer}>
          {task.subtasks!.map((subtask) => (
            <View
              key={subtask.id}
              style={[
                styles.subtaskCard,
                subtask.is_completed && styles.subtaskCardCompleted,
              ]}
            >
              <View style={styles.subtaskLeftColumn}>
                <View style={styles.expandPlaceholder} />
                <TouchableOpacity
                  style={styles.subtaskCheckbox}
                  onPress={() => onSubtaskToggle(subtask.id)}
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: subtask.is_completed }}
                  accessibilityLabel={
                    subtask.is_completed
                      ? t('taskCardExtra.a11yMarkStepPending', { task: subtask.content })
                      : t('taskCardExtra.a11yMarkStepComplete', { task: subtask.content })
                  }
                >
                  {subtask.is_completed && <View style={styles.subtaskCheckboxChecked} />}
                </TouchableOpacity>
              </View>
              <View style={styles.subtaskContent}>
                <Text
                  style={[
                    styles.subtaskText,
                    subtask.is_completed && styles.subtaskTextCompleted,
                  ]}
                  numberOfLines={2}
                >
                  {subtask.content}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {(expandedProjectSteps || (uniformCard && expandedDetails)) && hasProjectSteps && projectSteps && onToggleTask && (
        <View style={styles.projectStepsContainer}>
          <Text style={styles.projectStepsTitle}>{t('taskCard.projectStepsTitle')}</Text>
          {projectSteps.map((step) => (
            <TouchableOpacity
              key={step.id}
              style={[styles.projectStepRow, step.is_completed && styles.projectStepRowCompleted]}
              onPress={() => onToggleTask(step.id)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: step.is_completed }}
              accessibilityLabel={
                step.is_completed
                  ? t('taskCardExtra.a11yMarkStepPending', { task: step.content })
                  : t('taskCardExtra.a11yMarkStepComplete', { task: step.content })
              }
            >
              <View style={styles.projectStepCheckbox}>
                {step.is_completed && <View style={styles.taskCheckboxChecked} />}
              </View>
              <Text
                style={[styles.projectStepText, step.is_completed && styles.projectStepTextCompleted]}
                numberOfLines={2}
              >
                {step.content}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  taskWrapper: {
    position: 'relative',
    marginBottom: THEME.spacing.sm,
  },
  swipeActionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopRightRadius: THEME.borderRadius.rounded,
    borderBottomRightRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
  },
  swipeActionBtn: {
    minWidth: 88,
    width: 92,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: 8,
  },
  swipeActionBtnWide: {
    minWidth: 98,
    width: 102,
  },
  swipeActionComplete: {
    backgroundColor: THEME.colors.semantic.success,
  },
  swipeActionEdit: {
    backgroundColor: THEME.colors.gradient.blue,
  },
  swipeActionDelete: {
    backgroundColor: THEME.colors.semantic.danger,
  },
  swipeActionLabel: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.fill[100],
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    paddingHorizontal: 14,
    paddingVertical: 16,
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...THEME.shadows.card,
    position: 'relative',
    overflow: 'hidden',
  },
  taskCardProject: {
    borderLeftWidth: 5,
    backgroundColor: THEME.colors.fill[100],
  },
  taskCardSuelta: {
    borderLeftWidth: 0,
  },
  taskCardAligned: {
    marginLeft: -24,
    marginRight: -24,
    paddingLeft: 24,
    paddingRight: 24,
  },
  leftColumnAligned: {
    width: 0,
    gap: 0,
  },
  taskCheckboxAligned: {
    marginLeft: -24,
  },
  taskContentAligned: {
    /* Texto alineado con el título de sección (# Tareas) */
  },
  sueltaLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.standard,
    borderLeftWidth: 3,
  },
  contextBadgeSueltas: {
    borderLeftColor: THEME.colors.text.tertiary,
    backgroundColor: THEME.colors.fill[200],
  },
  contextBadgeEmoji: {
    fontSize: 12,
  },
  contextBadgeText: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    maxWidth: 140,
  },
  contextBadgeTextSueltas: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  perteneceLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
  },
  verPasosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verPasosText: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
  },
  projectStepsContainer: {
    marginTop: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
    paddingLeft: THEME.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.gradient.blue + '50',
  },
  projectStepsTitle: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  projectStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingRight: 8,
  },
  projectStepRowCompleted: {
    opacity: 0.7,
  },
  projectStepCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectStepText: {
    flex: 1,
    ...THEME.typography.body,
    fontSize: 14,
    color: THEME.colors.text.main,
  },
  projectStepTextCompleted: {
    textDecorationLine: 'line-through',
    color: THEME.colors.text.secondary,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  taskTextTouchable: {
    flex: 1,
    minWidth: 0,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
    flexShrink: 0,
  },
  categoryChipEmoji: {
    fontSize: 12,
  },
  categoryChipText: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    maxWidth: 80,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateChipText: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  metaRowSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  metaLine: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    flex: 1,
    minWidth: 0,
  },
  priorityWhyBlock: {
    marginTop: THEME.spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    gap: 4,
  },
  priorityWhyLabel: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.gradient.blue,
  },
  priorityWhyLine: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  priorityWhyBlockDown: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.fill[200],
    gap: 4,
  },
  priorityWhyLabelDown: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  priorityWhyLineDown: {
    ...THEME.typography.meta,
    color: THEME.colors.text.tertiary,
    lineHeight: 18,
  },
  verMasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verMasText: {
    ...THEME.typography.small,
    fontSize: 12,
    color: THEME.colors.text.secondary,
  },
  projectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: THEME.borderRadius.standard,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  projectBadgeProyecto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.standard,
    borderLeftWidth: 3,
  },
  projectBadgeEmoji: {
    fontSize: 12,
  },
  projectBadgeText: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    maxWidth: 140,
  },
  projectBadgeTextSuelta: {
    color: THEME.colors.text.secondary,
  },
  projectBadgeTextProyecto: {
    fontFamily: THEME.fonts.heading.bold,
  },
  subtasksPill: {
    backgroundColor: THEME.colors.gradient.blue + '18',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
  },
  subtasksPillText: {
    ...THEME.typography.meta,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  priorityNumberContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityNumberText: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 13,
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckboxChecked: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: THEME.colors.gradient.blue,
  },
  taskContent: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  taskText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
    minWidth: 0,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: THEME.colors.text.secondary,
  },
  leftColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    width: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandPlaceholder: {
    width: 40,
  },
  subtasksContainer: {
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  subtaskCard: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: THEME.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.gradient.blue + '40',
  },
  subtaskLeftColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtaskCardCompleted: {
    opacity: 0.6,
  },
  subtaskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskCheckboxChecked: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.gradient.blue,
  },
  subtaskContent: {
    flex: 1,
  },
  subtaskText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontSize: 14,
  },
  subtaskTextCompleted: {
    textDecorationLine: 'line-through',
    color: THEME.colors.text.secondary,
  },
  subtasksProgressContainer: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtasksProgressBar: {
    height: 3,
    flex: 1,
    minWidth: 0,
    backgroundColor: THEME.colors.stroke[100],
    borderRadius: 2,
    overflow: 'hidden',
  },
  subtasksProgressFill: {
    height: '100%',
    backgroundColor: THEME.colors.gradient.blue,
    borderRadius: 2,
  },
  subtasksProgressText: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    flexShrink: 0,
  },
  detailsToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  detailsToggleText: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
  },
  verProyectoLink: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  verProyectoLinkText: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.gradient.blue,
  },
  detailsPanel: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.gradient.blue,
  },
  detailsPanelTitle: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
    gap: THEME.spacing.sm,
  },
  detailsLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    minWidth: 72,
  },
  detailsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
    maxWidth: 180,
  },
  detailsChipEmoji: {
    fontSize: 14,
  },
  detailsChipText: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
  },
});
