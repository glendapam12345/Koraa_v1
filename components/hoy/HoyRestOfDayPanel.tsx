import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, CalendarRange, ListTodo } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { TaskList } from '@/components/tasks/TaskList';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { useI18n } from '@/contexts/I18nContext';
import type { Task } from '@/components/tasks/TaskCard';

type HoyRestOfDayPanelProps = {
  tasks: Task[];
  restTasks: Task[];
  projectsMap: Record<string, { name: string; color?: string }>;
  expandedTasks: Set<string>;
  expandedDetailsTasks: Set<string>;
  menuOpen: string | null;
  onMenuPress: (taskId: string) => void;
  onToggleTask: (taskId: string, isSubtask?: boolean, parentTaskId?: string) => void | Promise<void>;
  onToggleExpansion: (taskId: string) => void;
  onToggleDetailsExpansion: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onSubtaskToggle: (subtaskId: string, parentTaskId: string) => void;
  getCategoryColor: (category: string) => string;
  onCollapse: () => void;
};

export function HoyRestOfDayPanel({
  tasks,
  restTasks,
  projectsMap,
  expandedTasks,
  expandedDetailsTasks,
  menuOpen,
  onMenuPress,
  onToggleTask,
  onToggleExpansion,
  onToggleDetailsExpansion,
  onEditTask,
  onDeleteTask,
  onSubtaskToggle,
  getCategoryColor,
  onCollapse,
}: HoyRestOfDayPanelProps) {
  const { t } = useI18n();
  const count = restTasks.length;

  return (
    <CalmCard style={styles.wrap}>
      <TouchableOpacity
        style={styles.backBar}
        onPress={onCollapse}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('hoy.backToFocus')}
      >
        <ChevronLeft size={20} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.backText}>{t('hoy.backToFocus')}</Text>
      </TouchableOpacity>

      <View style={styles.titleRow}>
        <ListTodo size={20} color={THEME.colors.gradient.blue} />
        <View style={styles.titleCol}>
          <Text style={styles.title}>{t('hoy.restOfDayTitle')}</Text>
          {count > 0 ? (
            <Text style={styles.countLine}>
              {t(count === 1 ? 'hoy.restOfDayCountOne' : 'hoy.restOfDayCountMany', { count })}
            </Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.sub}>{t('hoy.restOfDaySub')}</Text>

      {count === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t('hoy.restOfDayEmpty')}</Text>
        </View>
      ) : (
        <View style={styles.listWrap}>
          <Text style={styles.listHint}>{t('hoy.focusListHint')}</Text>
          <TaskList
            tasks={tasks}
            incompleteTasks={restTasks}
            expandedTasks={expandedTasks}
            expandedDetailsTasks={expandedDetailsTasks}
            menuOpen={menuOpen}
            onToggleTask={onToggleTask}
            onToggleExpansion={onToggleExpansion}
            onToggleDetailsExpansion={onToggleDetailsExpansion}
            onMenuPress={onMenuPress}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            getCategoryColor={getCategoryColor}
            onSubtaskToggle={onSubtaskToggle}
            getProjectInfo={(task) => {
              if (task.project_id) {
                const p = projectsMap[task.project_id];
                const name = p?.name ?? t('hoyExtra.projectFallback');
                return {
                  label: t('hoyExtra.projectColon', { name }),
                  color: p?.color ?? THEME.colors.gradient.blue,
                  projectId: task.project_id,
                  projectName: name,
                };
              }
              return { label: '', color: THEME.colors.text.secondary };
            }}
            getProjectSteps={() => []}
            expandedProjectSteps={new Set()}
            onToggleProjectSteps={() => {}}
            onPressProject={(projectId) => router.push(`/project/${projectId}` as const)}
            uniformCard
          />
        </View>
      )}

      <TouchableOpacity
        style={styles.calendarLink}
        onPress={() => router.push('/(tabs)/semana')}
        activeOpacity={0.75}
        accessibilityRole="link"
        accessibilityLabel={t('hoy.restOfDayCalendarA11y')}
      >
        <CalendarRange size={18} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.calendarLinkText}>{t('hoy.restOfDayCalendar')}</Text>
      </TouchableOpacity>
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  backBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderRadius: THEME.borderRadius.pill,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
  },
  backText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  titleCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  countLine: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  sub: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
  },
  emptyText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  listWrap: {
    marginTop: THEME.spacing.xs,
    gap: THEME.spacing.sm,
  },
  listHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.metaOnFill,
    lineHeight: 18,
  },
  calendarLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    alignSelf: 'flex-start',
    paddingTop: THEME.spacing.xs,
  },
  calendarLinkText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
