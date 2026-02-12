import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { memo, useMemo } from 'react';
import { THEME } from '@/constants/theme';
import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react-native';

export interface Task {
  id: string;
  content: string;
  category: string;
  is_completed: boolean;
  parent_task_id: string | null;
  project_id?: string | null;
  subtasks?: Task[];
}

interface TaskCardProps {
  task: Task;
  index: number;
  isCompleted: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleExpansion: () => void;
  onMenuPress: () => void;
  getCategoryColor: (category: string) => string;
}

export const TaskCard = memo(function TaskCard({
  task,
  index,
  isCompleted,
  isExpanded,
  onToggle,
  onToggleExpansion,
  onMenuPress,
  getCategoryColor,
}: TaskCardProps) {
  const hasSubtasks = useMemo(() => task.subtasks && task.subtasks.length > 0, [task.subtasks]);
  const { completedSubtasks, totalSubtasks, subtasksProgress } = useMemo(() => {
    if (!hasSubtasks) {
      return { completedSubtasks: 0, totalSubtasks: 0, subtasksProgress: 0 };
    }
    const completed = task.subtasks!.filter(st => st.is_completed).length;
    const total = task.subtasks!.length;
    return {
      completedSubtasks: completed,
      totalSubtasks: total,
      subtasksProgress: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [hasSubtasks, task.subtasks]);

  return (
    <View style={styles.taskWrapper}>
      <TouchableOpacity
        onPress={hasSubtasks ? onToggleExpansion : onToggle}
        style={[
          styles.taskCard,
          isCompleted && styles.taskCardCompleted,
          hasSubtasks && styles.taskCardWithSubtasks,
          isCompleted && { opacity: 0.5 },
        ]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={isCompleted ? `Tarea completada: ${task.content}` : `Tarea ${index + 1}: ${task.content}`}
        accessibilityHint={hasSubtasks ? "Doble toque para expandir o colapsar subtareas" : "Doble toque para marcar como completada"}
      >
        {/* Número de prioridad (solo para tareas no completadas) */}
        {!isCompleted && (
          <View style={styles.priorityNumberContainer}>
            <View style={styles.priorityNumber}>
              <Text style={styles.priorityNumberText}>{index}</Text>
            </View>
          </View>
        )}

        {/* Botón expandir/colapsar si tiene subtareas */}
        {hasSubtasks && (
          <TouchableOpacity
            onPress={onToggleExpansion}
            style={styles.expandButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={isExpanded ? "Colapsar subtareas" : "Expandir subtareas"}
            accessibilityHint={`Tiene ${totalSubtasks} subtareas, ${completedSubtasks} completadas`}
          >
            {isExpanded ? (
              <ChevronUp size={20} color={THEME.colors.text.secondary} />
            ) : (
              <ChevronDown size={20} color={THEME.colors.text.secondary} />
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={onToggle}
          style={styles.taskCheckbox}
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.is_completed }}
          accessibilityLabel={task.is_completed ? "Marcar como no completada" : "Marcar como completada"}
          accessibilityHint={`Tarea: ${task.content}`}
        >
          {task.is_completed && <View style={styles.taskCheckboxChecked} />}
        </TouchableOpacity>
        
        <View style={styles.taskContent}>
          {/* Badge de tipo de tarea */}
          <View style={styles.taskTypeContainer}>
            {hasSubtasks ? (
              <View style={[styles.taskTypeBadge, styles.projectBadge]}>
                <Text style={styles.taskTypeIcon}>📁</Text>
                <Text style={styles.taskTypeText}>Proyecto</Text>
              </View>
            ) : task.parent_task_id ? (
              <View style={[styles.taskTypeBadge, styles.subtaskBadge]}>
                <Text style={styles.taskTypeIcon}>└</Text>
                <Text style={styles.taskTypeText}>Subtarea</Text>
              </View>
            ) : (
              <View style={[styles.taskTypeBadge, styles.taskBadge]}>
                <Text style={styles.taskTypeIcon}>✓</Text>
                <Text style={styles.taskTypeText}>Tarea</Text>
              </View>
            )}
          </View>

          <Text style={[
            styles.taskText,
            isCompleted && styles.taskTextCompleted,
          ]}>
            {task.content}
          </Text>
          
          {/* Indicador de progreso de subtareas */}
          {hasSubtasks && !isCompleted && (
            <View style={styles.subtasksProgressContainer}>
              <View style={styles.subtasksProgressBar}>
                <View 
                  style={[
                    styles.subtasksProgressFill,
                    { width: `${subtasksProgress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.subtasksProgressText}>
                {completedSubtasks} de {totalSubtasks} completadas
              </Text>
            </View>
          )}
          
          {task.category && (
            <View style={[
              styles.categoryBadge,
              { backgroundColor: getCategoryColor(task.category) + '20' },
            ]}>
              <Text style={[
                styles.categoryText,
                { color: getCategoryColor(task.category) },
              ]}>
                {task.category}
              </Text>
            </View>
          )}
        </View>

        {/* Botón de menú */}
        <TouchableOpacity
          onPress={onMenuPress}
          style={styles.menuButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Opciones de tarea"
          accessibilityHint="Abre menú para editar o eliminar esta tarea"
        >
          <MoreVertical size={20} color={THEME.colors.text.secondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.is_completed === nextProps.task.is_completed &&
    prevProps.task.content === nextProps.task.content &&
    prevProps.task.category === nextProps.task.category &&
    prevProps.index === nextProps.index &&
    prevProps.isCompleted === nextProps.isCompleted &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.task.subtasks?.length === nextProps.task.subtasks?.length &&
    prevProps.task.subtasks?.every((st, i) => 
      nextProps.task.subtasks?.[i]?.id === st.id &&
      nextProps.task.subtasks?.[i]?.is_completed === st.is_completed
    ) !== false
  );
});

const styles = StyleSheet.create({
  taskWrapper: {
    position: 'relative',
    marginBottom: THEME.spacing.sm,
  },
  taskCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    ...THEME.shadows.soft,
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
    minWidth: 44,
    minHeight: 44,
    padding: THEME.spacing.xs,
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
  taskTypeContainer: {
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
  projectBadge: {
    backgroundColor: 'rgba(74, 144, 226, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.25)',
  },
  taskBadge: {
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
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
  taskText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: THEME.colors.text.secondary,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
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
});
