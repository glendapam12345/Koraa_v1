import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { memo, useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { TaskCard } from './TaskCard';
import { TaskMenuModal } from './TaskMenuModal';
import type { Task } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  incompleteTasks: Task[];
  expandedTasks: Set<string>;
  menuOpen: string | null;
  onToggleTask: (taskId: string, isSubtask: boolean, parentTaskId?: string) => void;
  onToggleExpansion: (taskId: string) => void;
  onMenuPress: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  getCategoryColor: (category: string) => string;
  onSubtaskToggle: (subtaskId: string, parentTaskId: string) => void;
}

export const TaskList = memo(function TaskList({
  tasks,
  incompleteTasks,
  expandedTasks,
  menuOpen,
  onToggleTask,
  onToggleExpansion,
  onMenuPress,
  onEditTask,
  onDeleteTask,
  getCategoryColor,
  onSubtaskToggle,
}: TaskListProps) {
  const completedTasks = useMemo(
    () => tasks.filter(t => t.is_completed),
    [tasks]
  );
  const allTasksCompleted = useMemo(
    () => tasks.length > 0 && completedTasks.length === tasks.length,
    [tasks.length, completedTasks.length]
  );

  // Mostrar mensaje de paz cuando todas las tareas están completadas
  if (allTasksCompleted) {
    return (
      <View style={styles.completionState}>
        <View style={styles.completionIconContainer}>
          <Text style={styles.completionEmoji}>✨</Text>
        </View>
        <Text style={styles.completionTitle}>
          Hoy está completo
        </Text>
        <Text style={styles.completionMessage}>
          Has completado todas tus tareas prioritarias.{'\n'}
          Es momento de descansar y disfrutar del momento presente.
        </Text>
        <Text style={styles.completionAccent}>
          Descansa
        </Text>
      </View>
    );
  }

  const renderTask = (task: Task, index: number, isCompleted: boolean) => {
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isExpanded = expandedTasks.has(task.id);

    return (
      <View key={task.id}>
        <TaskCard
          task={task}
          index={index}
          isCompleted={isCompleted}
          isExpanded={isExpanded}
          onToggle={() => onToggleTask(task.id, false)}
          onToggleExpansion={() => onToggleExpansion(task.id)}
          onMenuPress={() => onMenuPress(task.id)}
          getCategoryColor={getCategoryColor}
        />
        
        {/* Menú desplegable */}
        {menuOpen === task.id && (
          <TaskMenuModal
            visible={true}
            onEdit={() => onEditTask(task)}
            onDelete={() => onDeleteTask(task)}
          />
        )}

        {/* Renderizar subtareas si está expandido */}
        {hasSubtasks && isExpanded && (
          <View style={styles.subtasksContainer}>
            {task.subtasks!.map((subtask) => (
              <TouchableOpacity
                key={subtask.id}
                onPress={() => onSubtaskToggle(subtask.id, task.id)}
                style={[
                  styles.subtaskCard,
                  subtask.is_completed && styles.subtaskCardCompleted,
                ]}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: subtask.is_completed }}
                accessibilityLabel={subtask.is_completed ? `Subtarea completada: ${subtask.content}` : `Subtarea: ${subtask.content}`}
                accessibilityHint="Doble toque para marcar como completada"
              >
                <View style={styles.subtaskCheckbox}>
                  {subtask.is_completed && (
                    <View style={styles.subtaskCheckboxChecked} />
                  )}
                </View>
                <View style={styles.subtaskContent}>
                  {/* Badge de subtarea */}
                  <View style={styles.subtaskTypeContainer}>
                    <View style={[styles.taskTypeBadge, styles.subtaskBadge]}>
                      <Text style={styles.taskTypeIcon}>└</Text>
                      <Text style={styles.taskTypeText}>Subtarea</Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.subtaskText,
                    subtask.is_completed && styles.subtaskTextCompleted,
                  ]}>
                    {subtask.content}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      {/* Tareas no completadas con números */}
      {incompleteTasks.map((task, index) => renderTask(task, index + 1, false))}
      
      {/* Tareas completadas sin números */}
      {completedTasks.map((task, index) => renderTask(task, index + 1, true))}
    </>
  );
}, (prevProps, nextProps) => {
  // Comparación optimizada para evitar re-renders innecesarios
  if (prevProps.tasks.length !== nextProps.tasks.length) return false;
  if (prevProps.incompleteTasks.length !== nextProps.incompleteTasks.length) return false;
  if (prevProps.menuOpen !== nextProps.menuOpen) return false;
  if (prevProps.expandedTasks.size !== nextProps.expandedTasks.size) return false;
  
  // Comparar IDs de tareas para detectar cambios
  const prevTaskIds = prevProps.tasks.map(t => t.id).join(',');
  const nextTaskIds = nextProps.tasks.map(t => t.id).join(',');
  if (prevTaskIds !== nextTaskIds) return false;
  
  // Comparar estados de completado
  const prevCompleted = prevProps.tasks.map(t => t.is_completed).join(',');
  const nextCompleted = nextProps.tasks.map(t => t.is_completed).join(',');
  if (prevCompleted !== nextCompleted) return false;
  
  return true;
});

const styles = StyleSheet.create({
  completionState: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    marginTop: THEME.spacing.lg,
  },
  completionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.fill[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  completionEmoji: {
    fontSize: 40,
  },
  completionTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  completionMessage: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: THEME.spacing.md,
  },
  completionAccent: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.gradient.pink,
    fontSize: 18,
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
  subtaskTypeContainer: {
    marginBottom: THEME.spacing.xs,
  },
  taskTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.pill,
    gap: 4,
  },
  subtaskBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.19)',
  },
  taskTypeIcon: {
    fontSize: 12,
  },
  taskTypeText: {
    ...THEME.typography.caption,
    fontSize: 10,
    fontFamily: THEME.fonts.heading.medium,
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
});
