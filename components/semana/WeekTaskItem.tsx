import { View, Text, StyleSheet } from 'react-native';
import { FolderKanban, FileText, ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { Task } from '@/hooks/useTasks';

type WeekTaskItemProps = {
  task: Task;
  projectName: string | null;
  projectColor?: string;
};

export function WeekTaskItem({ task, projectName, projectColor }: WeekTaskItemProps) {
  const { t } = useI18n();
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const accentColor = projectColor || THEME.colors.gradient.blue;
  const subtaskSuffix = hasSubtasks
    ? t('semanaExtra.a11yWeekTaskSubtasks', { count: task.subtasks!.length })
    : '';
  const completedSuffix = task.is_completed ? t('semanaExtra.a11yWeekTaskCompleted') : '';

  return (
    <View
      style={[styles.taskCard, { borderLeftColor: accentColor }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={t('semanaExtra.a11yWeekTask', {
        task: task.content,
        suffix: `${subtaskSuffix}${completedSuffix}`,
      })}
    >
      <View style={styles.taskRow}>
        <View style={[styles.taskCheck, task.is_completed && styles.taskCheckCompleted]} />
        <View style={styles.taskBody}>
          {projectName ? (
            <View style={styles.projectBadge}>
              <FolderKanban size={12} color={accentColor} />
              <Text style={[styles.projectBadgeText, { color: accentColor }]}>{projectName}</Text>
            </View>
          ) : (
            <View style={styles.standaloneBadge}>
              <FileText size={12} color={THEME.colors.text.secondary} />
              <Text style={styles.standaloneBadgeText}>{t('semana.looseTasks')}</Text>
            </View>
          )}
          <Text
            style={[styles.taskContent, task.is_completed && styles.taskContentCompleted]}
            numberOfLines={2}
          >
            {task.content}
          </Text>
          {hasSubtasks ? (
            <View style={styles.subtasksList}>
              {task.subtasks!.map((st) => (
                <View key={st.id} style={styles.subtaskRow}>
                  <ChevronRight size={14} color={THEME.colors.text.secondary} />
                  <Text
                    style={[styles.subtaskContent, st.is_completed && styles.taskContentCompleted]}
                    numberOfLines={1}
                  >
                    {st.content}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  taskCard: {
    ...THEME.surfaces.elevated,
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    borderLeftWidth: 4,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  taskCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: THEME.colors.calm.border,
    marginTop: 2,
  },
  taskCheckCompleted: {
    backgroundColor: THEME.colors.gradient.blue,
    borderColor: THEME.colors.gradient.blue,
  },
  taskBody: {
    flex: 1,
  },
  projectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 4,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    ...THEME.surfaces.chip,
  },
  projectBadgeText: {
    ...THEME.typography.small,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  standaloneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 4,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    ...THEME.surfaces.chip,
  },
  standaloneBadgeText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  taskContent: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  taskContentCompleted: {
    textDecorationLine: 'line-through',
    color: THEME.colors.text.secondary,
  },
  subtasksList: {
    marginTop: THEME.spacing.xs,
    paddingLeft: THEME.spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: THEME.colors.calm.border,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  subtaskContent: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    flex: 1,
  },
});
