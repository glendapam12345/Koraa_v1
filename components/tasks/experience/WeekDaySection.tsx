import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { WeekPlannerTaskRow } from '@/components/tasks/experience/WeekPlannerTaskRow';
import type { LifeArea, WeekPlannerDay } from '@/lib/lifeAreas/types';

type WeekDaySectionProps = {
  day: WeekPlannerDay;
  areas: LifeArea[];
  onRequestMove?: (taskId: string, dayId: string) => void;
};

export function WeekDaySection({ day, areas, onRequestMove }: WeekDaySectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{day.fullLabel}</Text>
        <Text style={styles.sectionSummary}>{day.summary}</Text>
      </View>
      <View style={styles.tasks}>
        {day.tasks.map((task) => (
          <WeekPlannerTaskRow
            key={task.id}
            task={task}
            areas={areas}
            onLongPress={onRequestMove ? () => onRequestMove(task.id, day.id) : undefined}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: THEME.spacing.sm,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  sectionSummary: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  tasks: {
    gap: 8,
  },
});
