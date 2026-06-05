import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { Task } from '@/hooks/useTasks';
import { WeekTaskItem } from '@/components/semana/WeekTaskItem';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { getEmotionCalendarAccent, getEmotionCalendarFill } from '@/lib/emotionCalendarColors';

type ProjectInfo = {
  name: string;
  color: string;
};

type SemanaDaySectionProps = {
  dateStr: string;
  title: string;
  tasks: Task[];
  projectsMap: Record<string, ProjectInfo>;
  isToday?: boolean;
  checkInChipText?: string | null;
  emotionId?: string | null;
  addTasksA11yLabel: string;
  addMoreA11yLabel: string;
};

export function SemanaDaySection({
  dateStr,
  title,
  tasks,
  projectsMap,
  isToday = false,
  checkInChipText = null,
  emotionId = null,
  addTasksA11yLabel,
  addMoreA11yLabel,
}: SemanaDaySectionProps) {
  const { t } = useI18n();
  const emotionAccent = emotionId ? getEmotionCalendarAccent(emotionId) : null;
  const emotionFill = emotionId ? getEmotionCalendarFill(emotionId) : null;

  const navigateToVaciar = () => {
    router.push(`/(tabs)/vaciar?date=${dateStr}`);
  };

  const renderCheckInChip = () =>
    checkInChipText ? (
      <View
        style={[
          styles.dayCheckInChip,
          emotionFill ? { backgroundColor: emotionFill, borderColor: emotionAccent ?? undefined } : null,
        ]}
      >
        <Text style={styles.dayCheckInChipText} numberOfLines={1}>
          {checkInChipText}
        </Text>
      </View>
    ) : null;

  const renderHeader = () => {
    if (isToday) {
      return (
        <LinearGradient
          colors={THEME.colors.gradientTint.dayToday}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.dayHeader,
            styles.dayHeaderToday,
            emotionAccent ? { borderLeftColor: emotionAccent, borderLeftWidth: 4 } : null,
          ]}
        >
          <Text style={[styles.dayLabel, styles.dayLabelToday]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.todayHeaderRight}>
            {renderCheckInChip()}
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>{t('semana.today')}</Text>
            </View>
          </View>
        </LinearGradient>
      );
    }

    return (
      <View
        style={[
          styles.dayHeader,
          emotionAccent ? { borderLeftWidth: 4, borderLeftColor: emotionAccent } : null,
        ]}
      >
        <Text style={styles.dayLabel} numberOfLines={1}>
          {title}
        </Text>
        {renderCheckInChip()}
      </View>
    );
  };

  return (
    <View
      style={styles.daySection}
      accessibilityRole="summary"
      accessibilityLabel={t('semanaExtra.a11yDaySection', { day: title })}
    >
      {renderHeader()}
      <View style={styles.dayBody}>
        {tasks.length === 0 ? (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayEmoji}>📅</Text>
            <Text style={styles.emptyDayText}>{t('semana.emptyDay')}</Text>
            <Text style={styles.emptyDayHint}>{t('semana.emptyHint')}</Text>
            <CalmPrimaryButton
              label={t('semana.addTasks')}
              onPress={navigateToVaciar}
              accessibilityLabel={addTasksA11yLabel}
            />
          </View>
        ) : (
          <>
            <View style={styles.taskList}>
              {tasks.map((task) => (
                <WeekTaskItem
                  key={task.id}
                  task={task}
                  projectName={
                    task.project_id
                      ? projectsMap[task.project_id]?.name || t('semana.projectFallback')
                      : null
                  }
                  projectColor={
                    task.project_id
                      ? projectsMap[task.project_id]?.color || THEME.colors.gradient.blue
                      : undefined
                  }
                />
              ))}
            </View>
            <TouchableOpacity
              style={styles.addDayButtonOutlined}
              onPress={navigateToVaciar}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={addMoreA11yLabel}
              accessibilityHint={t('semanaExtra.a11yAddMoreHint')}
            >
              <Plus size={16} color={THEME.colors.gradient.blue} />
              <Text style={styles.addDayButtonTextOutlined}>{t('semana.addMore')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  daySection: {
    marginBottom: 0,
    ...THEME.surfaces.elevated,
    borderRadius: THEME.borderRadius.rounded,
    padding: 0,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: 0,
    ...THEME.surfaces.muted,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.calm.border,
  },
  dayCheckInChip: {
    maxWidth: '48%',
    ...THEME.surfaces.elevated,
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  dayCheckInChipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  dayHeaderToday: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.surfaceOverlay.borderMedium,
  },
  todayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    flexShrink: 1,
  },
  dayBody: {
    padding: THEME.spacing.md,
  },
  dayLabel: {
    ...THEME.typography.h3,
    fontSize: 16,
    color: THEME.colors.text.main,
    flex: 1,
  },
  dayLabelToday: {
    color: THEME.colors.gradient.blue,
  },
  todayBadge: {
    marginLeft: THEME.spacing.sm,
    backgroundColor: THEME.colors.gradient.blue,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.standard,
  },
  todayBadgeText: {
    ...THEME.typography.small,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  emptyDay: {
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
    alignItems: 'center',
  },
  emptyDayEmoji: {
    fontSize: 40,
    marginBottom: THEME.spacing.xs,
  },
  emptyDayText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    marginBottom: 4,
  },
  emptyDayHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: THEME.spacing.md,
  },
  addDayButtonOutlined: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.standard,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: THEME.colors.gradient.blue,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    marginTop: THEME.spacing.xs,
  },
  addDayButtonTextOutlined: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
    fontSize: 13,
  },
  taskList: {
    gap: THEME.spacing.xs,
  },
});
