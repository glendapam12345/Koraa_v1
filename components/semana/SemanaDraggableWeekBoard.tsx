import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { DayTasks, Project } from '@/hooks/useWeekTasks';
import { buildSemanaPlannerModel } from '@/lib/semana/buildSemanaPlannerModel';
import { WeekPlannerDragBoard } from '@/components/tasks/experience/WeekPlannerDragBoard';
import { MoveTaskToDaySheet } from '@/components/tasks/experience/MoveTaskToDaySheet';

type SemanaDraggableWeekBoardProps = {
  weekTasks: DayTasks[];
  projects: Project[];
  onMoveTask: (taskId: string, targetDayId: string) => Promise<{ ok: boolean }>;
  moving?: boolean;
};

export function SemanaDraggableWeekBoard({
  weekTasks,
  projects,
  onMoveTask,
  moving = false,
}: SemanaDraggableWeekBoardProps) {
  const { t, locale } = useI18n();
  const [moveTask, setMoveTask] = useState<{ taskId: string; dayId: string; title: string } | null>(
    null,
  );

  const { days, areas } = useMemo(
    () => buildSemanaPlannerModel(weekTasks, projects, t('projectsUi.looseTitle'), locale),
    [weekTasks, projects, t, locale],
  );

  const openTasksCount = useMemo(
    () => days.reduce((sum, day) => sum + day.tasks.length, 0),
    [days],
  );

  const handleRequestMove = (taskId: string, dayId: string) => {
    const task = days.flatMap((day) => day.tasks).find((entry) => entry.id === taskId);
    if (!task) return;
    setMoveTask({ taskId, dayId, title: task.title });
  };

  const handleMoveToDay = async (targetDayId: string) => {
    if (!moveTask) return;
    await onMoveTask(moveTask.taskId, targetDayId);
    setMoveTask(null);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('semanaExtra.plannerDragTitle')}</Text>
        <Text style={styles.hint}>{t('tasksExperience.vision.plannerDragHintActive')}</Text>
      </View>

      <WeekPlannerDragBoard
        days={days}
        areas={areas}
        onMoveTask={onMoveTask}
        onRequestMoveSheet={handleRequestMove}
      />

      {openTasksCount === 0 ? (
        <View style={styles.emptyWeek}>
          <Text style={styles.emptyWeekEmoji}>📅</Text>
          <Text style={styles.emptyWeekTitle}>{t('semana.emptyDay')}</Text>
          <Text style={styles.emptyWeekHint}>{t('semana.emptyHint')}</Text>
        </View>
      ) : null}

      {moving ? (
        <ActivityIndicator color={THEME.colors.calm.lavenderDeep} style={styles.moving} />
      ) : null}

      <MoveTaskToDaySheet
        visible={moveTask != null}
        taskTitle={moveTask?.title ?? ''}
        days={days}
        currentDayId={moveTask?.dayId ?? ''}
        onSelect={(dayId) => void handleMoveToDay(dayId)}
        onClose={() => setMoveTask(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
  },
  header: {
    gap: 4,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  hint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  moving: {
    alignSelf: 'center',
  },
  emptyWeek: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: THEME.spacing.sm,
  },
  emptyWeekEmoji: {
    fontSize: THEME.typography.displayEmoji.fontSize,
    lineHeight: 34,
  },
  emptyWeekTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  emptyWeekHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
