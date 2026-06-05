import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { DayData } from '@/components/ProgressChart';
import { getEmotionCalendarAccent } from '@/lib/emotionCalendarColors';

type MiniMoodTimelineProps = {
  days: DayData[];
};

export function MiniMoodTimeline({ days }: MiniMoodTimelineProps) {
  const { t } = useI18n();
  const withCheckIn = days.filter((d) => d.hasCheckIn).length;

  if (days.length === 0) return null;

  return (
    <View
      style={styles.wrap}
      accessibilityLabel={t('paramiExtra.a11yMoodTimeline', {
        checkIns: withCheckIn,
        total: days.length,
      })}
    >
      <View style={styles.row}>
        {days.map((day) => {
          const color = day.emotion
            ? getEmotionCalendarAccent(day.emotion)
            : THEME.colors.fill[200];
          return (
            <View key={day.date} style={styles.cell}>
              <View
                style={[
                  styles.dot,
                  day.hasCheckIn ? styles.dotFilled : styles.dotEmpty,
                  day.hasCheckIn ? { backgroundColor: color } : undefined,
                ]}
              />
              <Text style={styles.dayLabel} numberOfLines={1}>
                {day.dayLabel.slice(0, 2)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 2,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotFilled: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  dotEmpty: {
    backgroundColor: THEME.colors.fill[200],
    opacity: 0.65,
  },
  dayLabel: {
    ...THEME.typography.meta,
    fontSize: 9,
    color: THEME.colors.onGradientFaint,
    textAlign: 'center',
  },
});
