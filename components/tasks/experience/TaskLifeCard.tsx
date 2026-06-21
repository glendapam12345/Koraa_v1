import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GripVertical, Calendar } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { LifeAreaBadge } from '@/components/tasks/experience/LifeAreaBadge';
import { TaskFlexPill } from '@/components/tasks/experience/TaskFlexPill';
import type { LifeArea, TaskLifeCardData } from '@/lib/lifeAreas/types';
import { formatProjectDueDate } from '@/lib/projectProgress';
import { useI18n } from '@/contexts/I18nContext';

type TaskLifeCardProps = {
  task: TaskLifeCardData;
  area: LifeArea;
  onPress?: () => void;
  draggableHint?: boolean;
  width?: number;
};

export function TaskLifeCard({
  task,
  area,
  onPress,
  draggableHint = true,
  width = 168,
}: TaskLifeCardProps) {
  const { t, locale } = useI18n();
  const dueLabel = task.dueDate ? formatProjectDueDate(task.dueDate, locale) : null;

  const content = (
    <View style={[styles.card, { borderLeftColor: area.color, width }]}>
      <View style={styles.topRow}>
        {draggableHint ? (
          <GripVertical size={16} color={THEME.colors.text.tertiary} strokeWidth={2} />
        ) : (
          <View style={styles.gripSpacer} />
        )}
        <TaskFlexPill level={task.flexLevel} />
      </View>

      <Text style={styles.title} numberOfLines={3}>
        {task.title}
      </Text>

      <View style={styles.footer}>
        <LifeAreaBadge area={area} compact />
        {dueLabel ? (
          <View style={styles.dueRow}>
            <Calendar size={12} color={THEME.colors.text.secondary} />
            <Text style={styles.dueText}>{dueLabel}</Text>
          </View>
        ) : (
          <Text style={styles.noDue}>{t('tasksExperience.noDueDate')}</Text>
        )}
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} accessibilityRole="button">
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    ...THEME.surfaces.elevated,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderLeftWidth: 5,
    padding: THEME.spacing.sm,
    gap: THEME.spacing.xs,
    minHeight: 148,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  gripSpacer: {
    width: 16,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 22,
    flex: 1,
  },
  footer: {
    gap: 6,
    marginTop: 4,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  noDue: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    lineHeight: 16,
  },
});
