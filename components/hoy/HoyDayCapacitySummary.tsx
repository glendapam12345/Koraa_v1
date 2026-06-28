import { View, Text, StyleSheet, Pressable } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { formatDurationLabel } from '@/lib/taskPlanningMeta';
import type { DayCapacitySnapshot } from '@/lib/hoy/dayCapacity';

type HoyDayCapacitySummaryProps = {
  capacity: DayCapacitySnapshot;
  energyLevel: number;
  onAdjustDay?: () => void;
};

export function HoyDayCapacitySummary({
  capacity,
  energyLevel,
  onAdjustDay,
}: HoyDayCapacitySummaryProps) {
  const { t } = useI18n();

  if (capacity.stepCount <= 0) return null;

  const availableLabel = formatDurationLabel(capacity.availableMinutes);
  const plannedLabel = formatDurationLabel(capacity.plannedMinutes);
  const fillRatio = Math.min(Math.max(capacity.loadRatio, 0), 1);

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.round(fillRatio * 100)}%` },
            capacity.isOverloaded && styles.fillOverload,
          ]}
        />
      </View>

      <Text style={styles.line}>
        {t('hoy.dayCapacityLine', {
          energy: energyLevel > 0 ? energyLevel : '—',
          available: availableLabel,
          count: capacity.stepCount,
          planned: plannedLabel,
        })}
      </Text>

      {capacity.isOverloaded ? (
        <>
          <Text style={styles.overload}>{t('hoy.dayCapacityOverload')}</Text>
          {onAdjustDay ? (
            <Pressable
              onPress={onAdjustDay}
              style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaPressed]}
              accessibilityRole="button"
              accessibilityLabel={t('hoy.dayCapacityAdjustCta')}
            >
              <Text style={styles.ctaLabel}>{t('hoy.dayCapacityAdjustCta')}</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
    marginTop: 2,
  },
  track: {
    height: 6,
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
  line: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  overload: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 18,
  },
  ctaBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavenderDeep,
    minHeight: 36,
    justifyContent: 'center',
  },
  ctaLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  ctaPressed: {
    opacity: 0.85,
  },
});
