import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle2,
  Calendar,
  List,
  Plus,
  Pencil,
  Trash2,
  Circle,
  Check,
} from 'lucide-react-native';
import { router, type Href } from 'expo-router';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/contexts/I18nContext';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { ProjectEditModal } from '@/components/projects/ProjectEditModal';
import type { ProjectLibraryItem } from '@/hooks/useProjectsLibrary';
import { confirmDeleteProject, deleteProjectById } from '@/lib/deleteProject';

type TaskPreview = {
  id: string;
  content: string;
  is_completed: boolean;
  scheduled_date: string | null;
};

type ProjectExpandableCardProps = {
  userId: string;
  onChanged?: () => void;
  onAddTask?: (projectId: string | null) => void;
} & (
  | { mode: 'project'; project: ProjectLibraryItem }
  | { mode: 'loose'; looseCount: number }
);

export function ProjectExpandableCard(props: ProjectExpandableCardProps) {
  const { userId, onChanged, onAddTask } = props;
  const isLoose = props.mode === 'loose';
  const project = isLoose ? null : props.project;
  const looseCount = isLoose ? props.looseCount : 0;

  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState<TaskPreview[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskPreview | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editingProject, setEditingProject] = useState(false);
  const [editName, setEditName] = useState(project?.name ?? '');
  const [editColor, setEditColor] = useState(project?.color ?? THEME.colors.gradient.blue);
  const [savingProject, setSavingProject] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      let query = supabase
        .from('tasks')
        .select('id, content, is_completed, scheduled_date')
        .eq('user_id', userId)
        .is('parent_task_id', null)
        .order('is_completed', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(20);

      if (isLoose) {
        query = query.is('project_id', null);
      } else if (project) {
        query = query.eq('project_id', project.id);
      }

      const { data, error } = await query;
      if (!error) setTasks((data as TaskPreview[]) ?? []);
    } finally {
      setLoadingTasks(false);
    }
  }, [isLoose, project, userId]);

  useEffect(() => {
    if (expanded) void loadTasks();
  }, [expanded, loadTasks]);

  useEffect(() => {
    if (project) {
      setEditName(project.name);
      setEditColor(project.color || THEME.colors.gradient.blue);
    }
  }, [project]);

  const toggleExpanded = () => setExpanded((v) => !v);

  const handleDeleteTask = (task: TaskPreview) => {
    const label = task.content.length > 40 ? `${task.content.slice(0, 40)}…` : task.content;
    Alert.alert(t('projectDetail.deleteTitle'), t('projectDetail.deleteBodyNamed', { task: label }), [
      { text: t('errors.cancel'), style: 'cancel' },
      {
        text: t('errors.delete'),
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('tasks').delete().eq('id', task.id);
          if (!error) {
            await loadTasks();
            onChanged?.();
          }
        },
      },
    ]);
  };

  const handleToggleTask = async (task: TaskPreview) => {
    const nextCompleted = !task.is_completed;
    const { error } = await supabase
      .from('tasks')
      .update({
        is_completed: nextCompleted,
        completed_at: nextCompleted ? new Date().toISOString() : null,
      })
      .eq('id', task.id);
    if (!error) {
      await loadTasks();
      onChanged?.();
    }
  };

  const handleDeleteProject = () => {
    if (!project) return;
    confirmDeleteProject(t, project.name, async () => {
      const result = await deleteProjectById(project.id);
      if (result.ok) {
        setExpanded(false);
        onChanged?.();
      }
    });
  };

  const saveTaskEdit = async () => {
    if (!editingTask || !editContent.trim()) return;
    const { error } = await supabase
      .from('tasks')
      .update({ content: editContent.trim() })
      .eq('id', editingTask.id);
    if (!error) {
      setEditingTask(null);
      await loadTasks();
      onChanged?.();
    }
  };

  const saveProjectEdit = async () => {
    if (!project || !editName.trim()) return;
    setSavingProject(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ name: editName.trim(), color: editColor })
        .eq('id', project.id);
      if (!error) {
        setEditingProject(false);
        onChanged?.();
      }
    } finally {
      setSavingProject(false);
    }
  };

  const openFullRoute: Href = isLoose
    ? '/project/sin-proyecto'
    : (`/project/${project!.id}` as Href);
  const displayTitle = isLoose ? t('projectsUi.looseTitle') : project!.name;
  const pendingCount = isLoose ? looseCount : project!.incompleteCount;
  const taskCount = isLoose ? looseCount : project!.taskCount;

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, isLoose && styles.cardLooseOuter]}>
        {isLoose ? (
          <LinearGradient
            colors={[THEME.colors.tint.blue.veryFaint, THEME.colors.tint.pink.soft]}
            style={styles.cardLooseGradient}
          />
        ) : null}
        <View
          style={[
            styles.colorBar,
            {
              backgroundColor: isLoose
                ? THEME.colors.text.tertiary
                : project!.color || THEME.colors.gradient.blue,
            },
          ]}
        />
        <TouchableOpacity
          style={styles.cardMain}
          onPress={() => router.push(openFullRoute)}
          activeOpacity={0.88}
          accessibilityRole="button"
        >
          {isLoose ? (
            <View style={styles.looseTitleRow}>
              <List size={18} color={THEME.colors.gradient.blue} />
              <Text style={styles.cardTitle} numberOfLines={1}>
                {displayTitle}
              </Text>
            </View>
          ) : (
            <Text style={styles.cardTitle} numberOfLines={1}>
              {displayTitle}
            </Text>
          )}
          <View style={styles.cardMeta}>
            {!isLoose && project!.incompleteCount === 0 && project!.taskCount > 0 ? (
              <View style={styles.cardMetaRow}>
                <CheckCircle2 size={14} color={THEME.colors.semantic.success} />
                <Text style={styles.cardMetaTextDone}>
                  {t('projectsUi.completed', {
                    count: project!.taskCount,
                    tasks: project!.taskCount === 1 ? t('components.task') : t('components.tasks'),
                  })}
                </Text>
              </View>
            ) : (
              <Text style={styles.cardMetaText}>
                {taskCount === 0
                  ? t('projectsUi.noTasks')
                  : pendingCount === 1
                    ? t('projectsUi.pendingOne', { count: pendingCount })
                    : t('projectsUi.pendingMany', { count: pendingCount })}
              </Text>
            )}
            {!isLoose && project!.withDateCount > 0 ? (
              <View style={styles.dateBadge}>
                <Calendar size={14} color={THEME.colors.text.secondary} strokeWidth={1.8} />
                <Text style={styles.dateBadgeText}>
                  {t('projectsUi.withDate', { count: project!.withDateCount })}
                </Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleExpanded}
          style={styles.expandBtn}
          accessibilityRole="button"
          accessibilityLabel={
            expanded
              ? t('projects.collapseTasksA11y')
              : t('projects.expandTasksA11y', { name: displayTitle })
          }
        >
          {expanded ? (
            <ChevronUp size={22} color={THEME.colors.gradient.blue} />
          ) : (
            <ChevronDown size={22} color={THEME.colors.gradient.blue} />
          )}
        </TouchableOpacity>
      </View>

      {expanded ? (
        <View style={styles.tasksPanel}>
          <View style={styles.tasksActions}>
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => onAddTask?.(isLoose ? null : project!.id)}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Plus size={16} color={THEME.colors.gradient.blue} />
              <Text style={styles.actionChipText}>{t('projects.addTaskToProject')}</Text>
            </TouchableOpacity>
            {!isLoose ? (
              <>
                <TouchableOpacity
                  style={styles.actionChip}
                  onPress={() => setEditingProject(true)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t('projects.renameProjectA11y', { name: project!.name })}
                >
                  <Pencil size={16} color={THEME.colors.gradient.blue} />
                  <Text style={styles.actionChipText}>{t('projects.renameProject')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionChip}
                  onPress={handleDeleteProject}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t('projects.deleteProjectA11y', { name: project!.name })}
                >
                  <Trash2 size={16} color={THEME.colors.semantic.danger} />
                  <Text style={[styles.actionChipText, styles.actionChipDanger]}>
                    {t('projects.deleteProject')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>

          {loadingTasks ? (
            <ActivityIndicator color={THEME.colors.gradient.blue} style={styles.tasksLoading} />
          ) : tasks.length === 0 ? (
            <Text style={styles.tasksEmpty}>{t('projects.noTasksInProject')}</Text>
          ) : (
            tasks.map((task) => (
              <View key={task.id} style={styles.taskRow}>
                <TouchableOpacity
                  onPress={() => void handleToggleTask(task)}
                  hitSlop={8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: task.is_completed }}
                >
                  {task.is_completed ? (
                    <Check size={18} color={THEME.colors.semantic.success} />
                  ) : (
                    <Circle size={18} color={THEME.colors.text.tertiary} />
                  )}
                </TouchableOpacity>
                <Text
                  style={[styles.taskText, task.is_completed && styles.taskTextDone]}
                  numberOfLines={2}
                >
                  {task.content}
                </Text>
                <View style={styles.taskRowActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingTask(task);
                      setEditContent(task.content);
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                  >
                    <Pencil size={16} color={THEME.colors.gradient.blue} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteTask(task)}
                    hitSlop={8}
                    accessibilityRole="button"
                  >
                    <Trash2 size={16} color={THEME.colors.semantic.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.openFullLink}
            onPress={() => router.push(openFullRoute)}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <Text style={styles.openFullLinkText}>{t('projects.openFullProject')}</Text>
            <ChevronRight size={16} color={THEME.colors.gradient.blue} />
          </TouchableOpacity>
        </View>
      ) : null}

      <TaskEditModal
        visible={editingTask != null}
        content={editContent}
        onContentChange={setEditContent}
        onSave={() => void saveTaskEdit()}
        onClose={() => setEditingTask(null)}
      />

      {!isLoose && project ? (
        <ProjectEditModal
          visible={editingProject}
          name={editName}
          color={editColor}
          onNameChange={setEditName}
          onColorChange={setEditColor}
          onSave={() => void saveProjectEdit()}
          onClose={() => setEditingProject(false)}
          onDelete={handleDeleteProject}
          saving={savingProject}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: THEME.spacing.sm + 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    paddingVertical: THEME.spacing.md + 2,
    paddingRight: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    overflow: 'hidden',
    ...THEME.shadows.card,
  },
  cardLooseOuter: {
    ...THEME.shadows.soft,
  },
  cardLooseGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  colorBar: {
    width: 5,
    height: '100%',
    minHeight: 48,
    borderTopLeftRadius: THEME.borderRadius.standard,
    borderBottomLeftRadius: THEME.borderRadius.standard,
    marginRight: THEME.spacing.sm,
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
  },
  looseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    ...THEME.typography.body,
    fontSize: 17,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    flex: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginTop: 6,
  },
  cardMetaText: {
    ...THEME.typography.small,
    fontSize: 13,
    color: THEME.colors.text.secondary,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardMetaTextDone: {
    ...THEME.typography.small,
    fontSize: 13,
    color: THEME.colors.semantic.success,
    fontFamily: THEME.fonts.heading.medium,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateBadgeText: {
    ...THEME.typography.small,
    fontSize: 12,
    color: THEME.colors.text.secondary,
  },
  expandBtn: {
    padding: THEME.spacing.sm,
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tasksPanel: {
    marginTop: THEME.spacing.xs,
    marginLeft: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    gap: THEME.spacing.xs,
  },
  tasksActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  actionChipText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.gradient.blue,
  },
  actionChipDanger: {
    color: THEME.colors.semantic.danger,
  },
  tasksLoading: {
    paddingVertical: THEME.spacing.sm,
  },
  tasksEmpty: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    paddingVertical: THEME.spacing.xs,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.stroke[100],
  },
  taskText: {
    ...THEME.typography.small,
    flex: 1,
    color: THEME.colors.text.main,
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: THEME.colors.text.tertiary,
  },
  taskRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  openFullLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
  },
  openFullLinkText: {
    ...THEME.typography.small,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
});
