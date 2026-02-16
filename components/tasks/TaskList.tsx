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
  /** Opcional: devuelve etiqueta, color y projectId para dimensión proyecto / tareas sueltas */
  getProjectInfo?: (task: Task) => { label: string; color: string; projectId?: string } | null;
  /** Al pulsar "Ver tareas del proyecto" */
  onPressProject?: (projectId: string) => void;
  /** En vista agrupada: ocultar badge en cada tarjeta y usar acento de sección */
  hideProjectLabel?: boolean;
  /** Color del acento lateral para todas las tareas de esta sección */
  sectionAccentColor?: string;
  /** Categoría de la sección (para ocultar chip redundante) */
  sectionCategory?: string;
  /** Tarjetas uniformes: sin borde de proyecto ni badge Suelta/Proyecto en la fila principal */
  uniformCard?: boolean;
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
  onPressProject,
  sectionCategory,
  uniformCard,
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
            projectId={projectInfo?.projectId}
            onPressProject={projectInfo?.projectId && onPressProject ? () => onPressProject(projectInfo.projectId!) : undefined}
            hideProjectLabel={hideProjectLabel}
            sectionAccentColor={sectionAccentColor}
            sectionCategory={sectionCategory}
            uniformCard={uniformCard}
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
