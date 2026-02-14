import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { ChevronDown, ChevronRight, MoreVertical, FolderKanban, FileText } from 'lucide-react-native';

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
  /** Etiqueta: "Independiente", "Parte de [proyecto]" o nombre del proyecto; color del proyecto */
  projectLabel?: string | null;
  projectLabelColor?: string;
  hideProjectLabel?: boolean;
  sectionAccentColor?: string;
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
  hideProjectLabel,
  sectionAccentColor,
}: TaskCardProps) {
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter((st) => st.is_completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const isProjectTask = task.project_id !== null && task.project_id !== undefined;
  const showLabel = !hideProjectLabel && projectLabel != null && projectLabel !== '';
  const isIndependiente = showLabel && (projectLabel === 'Suelta' || projectLabel === 'Independiente');
  const borderColor = !hideProjectLabel && isProjectTask && projectLabelColor ? projectLabelColor : sectionAccentColor;
  const hasDetails = onToggleDetailsExpand && (task.category || task.is_priority || projectLabel);

  return (
    <View style={styles.taskWrapper}>
      <View
        style={[
          styles.taskCard,
          task.is_completed && styles.taskCardCompleted,
          hasSubtasks && styles.taskCardWithSubtasks,
          !hideProjectLabel && isProjectTask && styles.taskCardProject,
          borderColor ? { borderLeftWidth: sectionAccentColor ? 3 : 4, borderLeftColor: borderColor } : undefined,
        ]}
      >
        {task.is_priority && !task.is_completed && (
          <View style={styles.priorityNumberContainer}>
            <View style={styles.priorityNumber}>
              <Text style={styles.priorityNumberText}>{index + 1}</Text>
            </View>
          </View>
        )}

        {hasSubtasks && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={onToggleExpansion}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Contraer subtareas' : 'Expandir subtareas'}
          >
            {expanded ? (
              <ChevronDown size={20} color={THEME.colors.text.secondary} />
            ) : (
              <ChevronRight size={20} color={THEME.colors.text.secondary} />
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.taskCheckbox}
          onPress={onToggle}
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.is_completed }}
        >
          {task.is_completed && <View style={styles.taskCheckboxChecked} />}
        </TouchableOpacity>

        <View style={styles.taskContent}>
          {showLabel && (
            <View
              style={[
                styles.projectBadge,
                isIndependiente
                  ? styles.projectBadgeIndependiente
                  : { backgroundColor: (projectLabelColor ?? THEME.colors.gradient.blue) + '22' },
              ]}
            >
              {isIndependiente ? (
                <FileText size={12} color={THEME.colors.text.secondary} />
              ) : (
                <FolderKanban size={12} color={projectLabelColor ?? THEME.colors.gradient.blue} />
              )}
              <Text
                style={[
                  styles.projectBadgeText,
                  isIndependiente ? styles.projectBadgeTextIndependiente : { color: projectLabelColor ?? THEME.colors.gradient.blue },
                ]}
                numberOfLines={1}
              >
                {projectLabel}
              </Text>
            </View>
          )}
          <Text
            style={[styles.taskText, task.is_completed && styles.taskTextCompleted]}
            numberOfLines={3}
          >
            {task.content}
          </Text>

          {hasSubtasks && (
            <View style={styles.subtasksProgressContainer}>
              <View style={styles.subtasksProgressBar}>
                <View
                  style={[
                    styles.subtasksProgressFill,
                    { width: `${(completedSubtasks / totalSubtasks) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.subtasksProgressText}>
                {completedSubtasks}/{totalSubtasks} completadas
              </Text>
            </View>
          )}

          {hasDetails && (
            <TouchableOpacity
              style={styles.detailsToggleRow}
              onPress={onToggleDetailsExpand}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel={expandedDetails ? 'Ocultar especificaciones' : 'Ver más especificaciones'}
            >
              <Text style={styles.detailsToggleText}>Ver más especificaciones</Text>
              {expandedDetails ? (
                <ChevronDown size={18} color={THEME.colors.gradient.blue} />
              ) : (
                <ChevronRight size={18} color={THEME.colors.gradient.blue} />
              )}
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={onMenuPress}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Más opciones"
        >
          <MoreVertical size={20} color={THEME.colors.text.secondary} />
        </TouchableOpacity>

        {menuOpen && (
          <View style={styles.menuDropdown}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={onEditTask}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={styles.menuItemText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={onDeleteTask}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {expandedDetails && hasDetails && (
        <View style={styles.detailsPanel}>
          <Text style={styles.detailsPanelTitle}>Especificaciones</Text>
          {task.category ? (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Categoría</Text>
              <View style={[styles.detailsChip, { backgroundColor: getCategoryColor(task.category) + '28' }]}>
                <Text style={[styles.detailsChipText, { color: getCategoryColor(task.category) }]} numberOfLines={1}>
                  {task.category}
                </Text>
              </View>
            </View>
          ) : null}
          {task.is_priority && !task.is_completed && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Prioridad</Text>
              <View style={[styles.detailsChip, { backgroundColor: THEME.colors.gradient.blue + '28' }]}>
                <Text style={[styles.detailsChipText, { color: THEME.colors.gradient.blue }]}>Alta</Text>
              </View>
            </View>
          )}
          {projectLabel && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Contexto</Text>
              <View
                style={[
                  styles.detailsChip,
                  { backgroundColor: (projectLabelColor ?? THEME.colors.gradient.blue) + '28' },
                ]}
              >
                <Text
                  style={[styles.detailsChipText, { color: projectLabelColor ?? THEME.colors.gradient.blue }]}
                  numberOfLines={1}
                >
                  {projectLabel}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {expanded && hasSubtasks && (
        <View style={styles.subtasksContainer}>
          {task.subtasks!.map((subtask) => (
            <View
              key={subtask.id}
              style={[
                styles.subtaskCard,
                subtask.is_completed && styles.subtaskCardCompleted,
              ]}
            >
              <TouchableOpacity
                style={styles.subtaskCheckbox}
                onPress={() => onSubtaskToggle(subtask.id)}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: subtask.is_completed }}
              >
                {subtask.is_completed && <View style={styles.subtaskCheckboxChecked} />}
              </TouchableOpacity>

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
    </View>
  );
}

const styles = StyleSheet.create({
  taskWrapper: {
    position: 'relative',
    marginBottom: THEME.spacing.sm,
  },
  taskCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    ...THEME.shadows.soft,
    position: 'relative',
    overflow: 'hidden',
  },
  taskCardProject: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.gradient.blue,
    backgroundColor: THEME.colors.fill[200],
  },
  projectBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 6,
  },
  projectBadgeIndependiente: {
    backgroundColor: THEME.colors.fill[200],
  },
  projectBadgeText: {
    ...THEME.typography.small,
    fontSize: 11,
    fontFamily: THEME.fonts.heading.medium,
    maxWidth: 160,
  },
  projectBadgeTextIndependiente: {
    color: THEME.colors.text.secondary,
  },
  priorityNumberContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityNumberText: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 16,
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
  },
  taskText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontSize: 14,
    lineHeight: 20,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: THEME.colors.text.secondary,
  },
  taskCardWithSubtasks: {
    borderLeftWidth: 4,
    /* El color de la barra lo define sectionAccentColor/projectLabelColor en el estilo inline */
  },
  expandButton: {
    padding: THEME.spacing.sm,
    marginRight: THEME.spacing.xs,
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtasksContainer: {
    marginLeft: THEME.spacing.lg,
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
    paddingLeft: THEME.spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: THEME.colors.stroke[100],
  },
  subtaskCard: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
    marginLeft: THEME.spacing.lg,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 107, 107, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
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
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  subtasksProgressBar: {
    height: 4,
    backgroundColor: THEME.colors.stroke[100],
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  subtasksProgressFill: {
    height: '100%',
    backgroundColor: THEME.colors.gradient.blue,
    borderRadius: 2,
  },
  subtasksProgressText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontSize: 11,
  },
  detailsToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    paddingRight: THEME.spacing.xs,
  },
  detailsToggleText: {
    ...THEME.typography.small,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
    fontSize: 13,
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
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
    fontSize: 11,
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
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontSize: 12,
    minWidth: 72,
  },
  detailsChip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.pill,
    maxWidth: 180,
  },
  detailsChipText: {
    ...THEME.typography.small,
    fontSize: 12,
    fontFamily: THEME.fonts.heading.medium,
  },
  menuButton: {
    padding: THEME.spacing.sm,
    marginLeft: THEME.spacing.xs,
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  menuDropdown: {
    position: 'absolute',
    right: 0,
    top: 50,
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.xs,
    minWidth: 150,
    ...THEME.shadows.soft,
    zIndex: 1000,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
  },
  menuItemDanger: {
    marginTop: THEME.spacing.xs,
  },
  menuItemText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontSize: 14,
  },
  menuItemTextDanger: {
    color: '#FF6B6B',
  },
});
