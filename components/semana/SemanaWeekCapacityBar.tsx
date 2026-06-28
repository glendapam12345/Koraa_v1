import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { formatDurationLabel } from '@/lib/taskPlanningMeta';
import type { WeekCapacitySnapshot } from '@/lib/hoy/weekCapacity';

type SemanaWeekCapacityBarProps = {
  capacity: WeekCapacitySnapshot;
};

export function SemanaWeekCapacityBar({ capacity }: SemanaWeekCapacityBarProps) {
  const { t } = useI18n();
  const maxMinutes = Math.max(...capacity.days.map((day) => day.plannedMinutes), 1);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('semana.weekCapacityTitle')}</Text>

      <View style={styles.daysRow}>
        {capacity.days.map((day) => {
          const fillRatio = day.plannedMinutes / maxMinutes;
          const isBusiest = day.date === capacity.busiestDate && capacity.busiestMinutes > 0;
          return (
            <View key={day.date} style={styles.dayCol}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { height: `${Math.max(Math.round(fillRatio * 100), day.stepCount > 0 ? 12 : 0)}%` },
                    isBusiest && styles.fillBusiest,
                    day.isToday && styles.fillToday,
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]} numberOfLines={1}>
                {day.dayName.slice(0, 3)}
              </Text>
              {day.stepCount > 0 ? (
                <Text style={styles.minuteLabel} numberOfLines={1}>
                  {formatDurationLabel(day.plannedMinutes)}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>

      {capacity.busiestDayName && capacity.busiestMinutes > 0 ? (
        <Text style={styles.hint}>
          {t('semana.weekCapacityBusiest', {
            day: capacity.busiestDayName,
            duration: formatDurationLabel(capacity.busiestMinutes),
          })}
        </Text>
      ) : null}

      {capacity.isWeekImbalanced ? (
        <Text style={styles.imbalance}>{t('semana.weekCapacityImbalance')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
    paddingTop: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  track: {
    width: '100%',
    height: 56,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    minHeight: 0,
  },
  fillBusiest: {
    backgroundColor: THEME.colors.gradient.pink,
  },
  fillToday: {
    opacity: 0.92,
  },
  dayLabel: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    textTransform: 'capitalize',
  },
  dayLabelToday: {
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  minuteLabel: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontSize: 10,
    lineHeight: 12,
  },
  hint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  imbalance: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 18,
  },
});
