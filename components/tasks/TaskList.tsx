import { View, StyleSheet } from 'react-native';
import { Task, TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  incompleteTasks: Task[];
  expandedTasks: Set<string>;
  expandedDetailsTasks?: Set<string>;
  menuOpen: string | null;
  onToggleTask: (taskId: string, isSubtask?: boolean, parentTaskId?: string) => void;
  onToggleExpansion: (taskId: string) => void;
  onToggleDetailsExpansion?: (taskId: string) => void;
  onMenuPress: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  getCategoryColor: (category: string) => string;
  onSubtaskToggle: (subtaskId: string, parentTaskId: string) => void;
  /** Opcional: devuelve etiqueta y color para mostrar "Independiente" / "Parte de [proyecto]" / nombre proyecto */
  getProjectInfo?: (task: Task) => { label: string; color: string } | null;
  /** En vista agrupada: ocultar badge en cada tarjeta y usar acento de sección */
  hideProjectLabel?: boolean;
  /** Color del acento lateral para todas las tareas de esta sección */
  sectionAccentColor?: string;
}

export function TaskList({
  tasks,
  incompleteTasks,
  expandedTasks,
  expandedDetailsTasks = new Set(),
  menuOpen,
  onToggleTask,
  onToggleExpansion,
  onToggleDetailsExpansion,
  onMenuPress,
  onEditTask,
  onDeleteTask,
  getCategoryColor,
  onSubtaskToggle,
  getProjectInfo,
  hideProjectLabel,
  sectionAccentColor,
}: TaskListProps) {
  return (
    <View style={styles.container}>
      {incompleteTasks.map((task, index) => {
        const projectInfo = getProjectInfo?.(task) ?? null;
        return (
          <TaskCard
            key={task.id}
            task={task}
            index={index}
            expanded={expandedTasks.has(task.id)}
            expandedDetails={onToggleDetailsExpansion ? expandedDetailsTasks.has(task.id) : false}
            onToggleDetailsExpand={onToggleDetailsExpansion ? () => onToggleDetailsExpansion(task.id) : undefined}
            menuOpen={menuOpen === task.id}
            onToggle={() => onToggleTask(task.id)}
            onToggleExpansion={() => onToggleExpansion(task.id)}
            onMenuPress={() => onMenuPress(task.id)}
            onEditTask={() => onEditTask(task)}
            onDeleteTask={() => onDeleteTask(task)}
            getCategoryColor={getCategoryColor}
            onSubtaskToggle={(subtaskId) => onSubtaskToggle(subtaskId, task.id)}
            projectLabel={projectInfo?.label ?? null}
            projectLabelColor={projectInfo?.color}
            hideProjectLabel={hideProjectLabel}
            sectionAccentColor={sectionAccentColor}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
