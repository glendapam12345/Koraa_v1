import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { CalendarDayData } from '@/hooks/useMonthCalendar';
import { getEmotionCalendarFill, getEmotionCalendarAccent } from '@/lib/emotionCalendarColors';

const WEEKDAY_KEYS = [
  'semana.weekdayMon',
  'semana.weekdayTue',
  'semana.weekdayWed',
  'semana.weekdayThu',
  'semana.weekdayFri',
  'semana.weekdaySat',
  'semana.weekdaySun',
] as const;

type SemanaCalendarGridProps = {
  days: CalendarDayData[];
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
};

export function SemanaCalendarGrid({ days, selectedDate, onSelectDate }: SemanaCalendarGridProps) {
  const { t } = useI18n();
  const weeks: CalendarDayData[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.weekdayRow}>
        {WEEKDAY_KEYS.map((key) => (
          <Text key={key} style={styles.weekdayLabel}>
            {t(key)}
          </Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={`w-${wi}`} style={styles.weekRow}>
          {week.map((day) => {
            const selected = selectedDate === day.dateStr;
            const hasCheckIn = Boolean(day.emotion);
            const fill = hasCheckIn ? getEmotionCalendarFill(day.emotion) : THEME.colors.fill[200];
            const accent = hasCheckIn ? getEmotionCalendarAccent(day.emotion) : THEME.colors.stroke[100];

            return (
              <TouchableOpacity
                key={day.dateStr}
                style={[
                  styles.cell,
                  { backgroundColor: fill },
                  !day.inCurrentMonth && styles.cellOutside,
                  day.isToday && styles.cellToday,
                  selected && styles.cellSelected,
                ]}
                onPress={() => onSelectDate(day.dateStr)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('semana.calendarDayA11y', {
                  day: day.dayNumber,
                  tasks: day.taskCount,
                })}
                accessibilityState={{ selected }}
              >
                {day.isToday ? (
                  <Text style={styles.todayTag}>{t('semana.today')}</Text>
                ) : null}
                <Text
                  style={[
                    styles.dayNum,
                    !day.inCurrentMonth && styles.dayNumOutside,
                    selected && styles.dayNumSelected,
                  ]}
                >
                  {day.dayNumber}
                </Text>
                {day.taskCount > 0 ? (
                  <View style={[styles.taskBadge, { backgroundColor: accent }]}>
                    <Text style={styles.taskBadgeText}>{day.incompleteCount || day.taskCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 0,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.xs,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 4,
  },
  cell: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: THEME.borderRadius.standard,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 44,
  },
  cellOutside: {
    opacity: 0.45,
  },
  cellToday: {
    borderColor: THEME.colors.gradient.blue,
    borderWidth: 2,
  },
  cellSelected: {
    borderColor: THEME.colors.gradient.pink,
    borderWidth: 2,
  },
  todayTag: {
    ...THEME.typography.small,
    fontSize: 9,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
    position: 'absolute',
    top: 3,
  },
  dayNum: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  dayNumOutside: {
    color: THEME.colors.text.secondary,
  },
  dayNumSelected: {
    color: THEME.colors.gradient.pink,
  },
  taskBadge: {
    position: 'absolute',
    bottom: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskBadgeText: {
    fontSize: 10,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
});
