import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { SemanaStripDay } from '@/lib/semana/buildWeekDayStrip';

type SemanaWeekDayStripProps = {
  days: SemanaStripDay[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  lockedDateKeys?: Set<string>;
  onLockedPress?: () => void;
};

const WEEKDAY_KEYS_ES = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] as const;
const WEEKDAY_KEYS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

/** Cinta semanal estilo mock: un día seleccionado, energía suave. */
export function SemanaWeekDayStrip({
  days,
  selectedDate,
  onSelectDate,
  lockedDateKeys,
  onLockedPress,
}: SemanaWeekDayStripProps) {
  const { locale, t } = useI18n();
  const letters = locale === 'en' ? WEEKDAY_KEYS_EN : WEEKDAY_KEYS_ES;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
      accessibilityRole="tablist"
    >
      {days.map((day) => {
        const selected = day.dateStr === selectedDate;
        const locked = lockedDateKeys ? !lockedDateKeys.has(day.dateStr) : false;
        const energySoft =
          day.energyLevel != null && day.energyLevel > 0 && day.energyLevel <= 2;

        return (
          <TouchableOpacity
            key={day.dateStr}
            style={[
              styles.cell,
              day.isToday && styles.cellToday,
              selected && styles.cellSelected,
              locked && styles.cellLocked,
            ]}
            onPress={() => {
              if (locked) {
                onLockedPress?.();
                return;
              }
              onSelectDate(day.dateStr);
            }}
            activeOpacity={0.85}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled: locked }}
            accessibilityLabel={t('semana.stripDayA11y', {
              day: letters[day.weekdayIndex],
              date: day.dayNum,
            })}
          >
            <Text style={[styles.weekday, selected && styles.weekdaySelected]}>
              {letters[day.weekdayIndex]}
            </Text>
            <Text style={[styles.dayNum, selected && styles.dayNumSelected]}>{day.dayNum}</Text>
            {energySoft ? <View style={styles.energyDot} /> : <View style={styles.energyDotSpacer} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: {
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  cell: {
    width: 48,
    minHeight: 72,
    borderRadius: THEME.borderRadius.rounded,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  cellToday: {
    borderColor: THEME.colors.calm.lavender,
  },
  cellSelected: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  cellLocked: {
    opacity: 0.45,
  },
  weekday: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.tertiary,
    lineHeight: 14,
  },
  weekdaySelected: {
    color: THEME.colors.onGradient,
  },
  dayNum: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  dayNumSelected: {
    color: THEME.colors.onGradient,
  },
  energyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.calm.blush,
  },
  energyDotSpacer: {
    width: 6,
    height: 6,
  },
});
