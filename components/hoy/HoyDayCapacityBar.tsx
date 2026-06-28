import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { formatDurationLabel } from '@/lib/taskPlanningMeta';
import type { DayCapacitySnapshot } from '@/lib/hoy/dayCapacity';

type HoyDayCapacityBarProps = {
  capacity: DayCapacitySnapshot;
};

export function HoyDayCapacityBar({ capacity }: HoyDayCapacityBarProps) {
  const { t } = useI18n();
  const { availableMinutes, plannedMinutes, stepCount, isOverloaded, loadRatio } = capacity;

  const fillRatio = Math.min(Math.max(loadRatio, 0), 1);
  const plannedLabel = formatDurationLabel(plannedMinutes);
  const availableLabel = formatDurationLabel(availableMinutes);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('reorganizeDay.capacityTitle')}</Text>
        <Text style={styles.stepCount}>
          {t('reorganizeDay.capacitySteps', { count: stepCount })}
        </Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.round(fillRatio * 100)}%` },
            isOverloaded && styles.fillOverload,
          ]}
        />
      </View>

      <View style={styles.legendRow}>
        <Text style={styles.legendPlanned}>
          {t('reorganizeDay.capacityPlanned', { duration: plannedLabel })}
        </Text>
        <Text style={styles.legendAvailable}>
          {t('reorganizeDay.capacityAvailable', { duration: availableLabel })}
        </Text>
      </View>

      <Text style={[styles.hint, isOverloaded ? styles.hintOverload : styles.hintFit]}>
        {isOverloaded ? t('reorganizeDay.capacityOverload') : t('reorganizeDay.capacityFit')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    gap: THEME.spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stepCount: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
  },
  track: {
    height: 8,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  fillOverload: {
    backgroundColor: THEME.colors.gradient.pink,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
  legendPlanned: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
  },
  legendAvailable: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  hint: {
    ...THEME.typography.caption,
    lineHeight: 18,
  },
  hintFit: {
    color: THEME.colors.text.secondary,
  },
  hintOverload: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
});
