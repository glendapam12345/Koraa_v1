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
  /** Opcional: devuelve etiqueta, color, projectId y projectName para leyenda / pasos */
  getProjectInfo?: (task: Task) => { label: string; color: string; projectId?: string; projectName?: string } | null;
  /** Tareas del mismo proyecto (excl. la actual) para "siguientes pasos" */
  getProjectSteps?: (projectId: string, excludeTaskId: string) => Task[];
  /** IDs de tareas con pasos del proyecto expandidos */
  expandedProjectSteps?: Set<string>;
  onToggleProjectSteps?: (taskId: string) => void;
  /** Al pulsar "Ver tareas del proyecto" */
  onPressProject?: (projectId: string) => void;
  /** En vista agrupada: ocultar badge en cada tarjeta y usar acento de sección */
  hideProjectLabel?: boolean;
  /** Color del acento lateral para todas las tareas de esta sección */
  sectionAccentColor?: string;
  /** Categoría de la sección (para ocultar chip redundante) */
  sectionCategory?: string;
  /** Tarjetas uniformes: leyenda solo "Pertenece a X", sin "Suelta" */
  uniformCard?: boolean;
  hideCalendarExport?: boolean;
  /** Insight de priorización por id de tarea (Hoy + check-in). */
  getTaskPriorityInsight?: (taskId: string) => { whyUp: string[]; whyDown: string[] } | undefined;
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
  getProjectSteps,
  expandedProjectSteps = new Set(),
  onToggleProjectSteps,
  onPressProject,
  hideProjectLabel,
  sectionAccentColor,
  sectionCategory,
  uniformCard,
  hideCalendarExport,
  getTaskPriorityInsight,
}: TaskListProps) {
  return (
    <View style={styles.container}>
      {incompleteTasks.map((task, index) => {
        const projectInfo = getProjectInfo?.(task) ?? null;
        const projectId = projectInfo?.projectId;
        const projectSteps = projectId && getProjectSteps ? getProjectSteps(projectId, task.id) : undefined;
        const priorityInsight = getTaskPriorityInsight?.(task.id);
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
            projectId={projectId}
            projectName={projectInfo?.projectName}
            onPressProject={projectId && onPressProject ? () => onPressProject(projectId) : undefined}
            projectSteps={projectSteps}
            expandedProjectSteps={expandedProjectSteps.has(task.id)}
            onToggleProjectSteps={onToggleProjectSteps ? () => onToggleProjectSteps(task.id) : undefined}
            onToggleTask={onToggleTask}
            hideProjectLabel={hideProjectLabel}
            sectionAccentColor={sectionAccentColor}
            sectionCategory={sectionCategory}
            uniformCard={uniformCard}
            hideCalendarExport={hideCalendarExport}
            priorityWhyUp={priorityInsight?.whyUp}
            priorityWhyDown={priorityInsight?.whyDown}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  /** Sin flex:1 — evita hueco enorme bajo la última tarea dentro de tarjetas en ScrollView. */
  container: {},
});
