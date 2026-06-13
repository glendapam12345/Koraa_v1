import { View, Text, StyleSheet } from 'react-native';
import { Calendar, TrendingUp } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { computeProjectProgress, formatProjectDueDate } from '@/lib/projectProgress';

type ProjectMetaRowProps = {
  taskCount: number;
  incompleteCount: number;
  dueDate?: string | null;
  accentColor?: string;
};

/** Fecha de entrega + barra de progreso del proyecto. */
export function ProjectMetaRow({
  taskCount,
  incompleteCount,
  dueDate = null,
  accentColor = THEME.colors.gradient.blue,
}: ProjectMetaRowProps) {
  const { t, locale } = useI18n();
  const progress = computeProjectProgress(taskCount, incompleteCount);
  const dueLabel = formatProjectDueDate(dueDate, locale);

  if (taskCount === 0 && !dueLabel) return null;

  return (
    <View style={styles.wrap}>
      {dueLabel ? (
        <View style={styles.dueRow}>
          <Calendar size={14} color={THEME.colors.text.secondary} />
          <Text style={styles.dueText}>
            {t('projectsUi.dueDate', { date: dueLabel })}
          </Text>
        </View>
      ) : null}

      {taskCount > 0 ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <TrendingUp size={14} color={accentColor} />
            <Text style={styles.progressLabel}>
              {t('projectsUi.progressPercent', { percent: progress.percent })}
            </Text>
            <Text style={styles.progressDetail}>
              {t('projectsUi.progressDetail', {
                done: progress.completed,
                total: progress.total,
              })}
            </Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${progress.percent}%`,
                  backgroundColor: accentColor,
                },
              ]}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  progressBlock: {
    gap: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  progressLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  progressDetail: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.fill[200],
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 4,
  },
});
