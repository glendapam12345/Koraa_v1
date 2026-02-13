import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { ChevronDown, ChevronRight, MoreVertical, FolderKanban } from 'lucide-react-native';

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
  menuOpen: boolean;
  onToggle: () => void;
  onToggleExpansion: () => void;
  onMenuPress: () => void;
  onEditTask: () => void;
  onDeleteTask: () => void;
  getCategoryColor: (category: string) => string;
  onSubtaskToggle: (subtaskId: string) => void;
  /** Si se pasa, se muestra una etiqueta "Pertenece a [proyecto]" en el color del proyecto, o "Suelta" en gris */
  projectLabel?: string | null;
  projectLabelColor?: string;
}

export function TaskCard({
  task,
  index,
  expanded,
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
}: TaskCardProps) {
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter((st) => st.is_completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const isProjectTask = task.project_id !== null && task.project_id !== undefined;
  const showLabel = projectLabel != null && projectLabel !== '';

  return (
    <View style={styles.taskWrapper}>
      <View
        style={[
          styles.taskCard,
          task.is_completed && styles.taskCardCompleted,
          hasSubtasks && styles.taskCardWithSubtasks,
          isProjectTask && styles.taskCardProject,
        ]}
      >
        {isProjectTask && !showLabel && (
          <View style={styles.projectIndicator}>
            <View style={styles.projectIndicatorBar} />
          </View>
        )}

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
            <Text
              style={[
                styles.projectLabelText,
                { color: projectLabelColor ?? THEME.colors.text.secondary },
              ]}
              numberOfLines={1}
            >
              {projectLabel}
            </Text>
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
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={onMenuPress}
          activeOpacity={0.7}
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
  projectIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  projectIndicatorBar: {
    width: '100%',
    height: '100%',
    backgroundColor: THEME.colors.gradient.blue,
  },
  projectBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.gradient.blue,
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    marginBottom: THEME.spacing.xs,
  },
  projectBadgeText: {
    ...THEME.typography.caption,
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: THEME.fonts.heading.bold,
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
  projectLabelText: {
    ...THEME.typography.small,
    fontSize: 11,
    marginBottom: 4,
    fontFamily: THEME.fonts.heading.medium,
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
    borderLeftColor: THEME.colors.gradient.blue,
    backgroundColor: 'rgba(74, 144, 226, 0.02)',
  },
  expandButton: {
    padding: THEME.spacing.sm,
    marginRight: THEME.spacing.xs,
    minWidth: 44,
    minHeight: 44,
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
  menuButton: {
    padding: THEME.spacing.sm,
    marginLeft: THEME.spacing.xs,
    minWidth: 44,
    minHeight: 44,
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
