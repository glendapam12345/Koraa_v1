import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { DayData } from '@/lib/checkInDayData';
import { formatCheckInDateLabel, energyGridColumns, chunkEnergyRows } from '@/lib/energyChart';
import { getEmotionCalendarAccent } from '@/lib/emotionCalendarColors';
import { getEmotionEmoji } from '@/lib/emotionEmoji';

type MiniMoodTimelineProps = {
  days: DayData[];
  monthNames?: readonly string[];
  period?: 'week' | 'twoWeeks' | 'month';
};

function gridColumns(dayCount: number): number {
  return energyGridColumns(dayCount);
}

function chunkRows(days: DayData[], columns: number): DayData[][] {
  return chunkEnergyRows(days, columns);
}

function labelForDay(
  day: DayData,
  total: number,
  monthNames?: readonly string[],
): string {
  if (total <= 7) return day.dayLabel.slice(0, 2);
  if (monthNames?.length) return formatCheckInDateLabel(day.date, monthNames);
  const dayNum = day.date.slice(8);
  return dayNum.startsWith('0') ? dayNum.slice(1) : dayNum;
}

function MoodFaceCell({
  day,
  compact,
  total,
  monthNames,
}: {
  day: DayData;
  compact: boolean;
  total: number;
  monthNames?: readonly string[];
}) {
  const hasMood = Boolean(day.hasCheckIn && day.emotion);
  const accent = day.emotion ? getEmotionCalendarAccent(day.emotion) : THEME.colors.fill[200];
  const emoji = hasMood ? getEmotionEmoji(day.emotion) : null;
  const dateLabel = labelForDay(day, total, monthNames);

  return (
    <View style={[styles.cell, compact && styles.cellCompact]}>
      <View
        style={[
          compact ? styles.faceBoxSm : styles.faceBox,
          hasMood ? styles.faceBoxFilled : styles.faceBoxEmpty,
          hasMood ? { borderColor: accent } : undefined,
        ]}
        accessibilityElementsHidden={!hasMood}
      >
        {hasMood ? (
          <Text style={[styles.emoji, compact && styles.emojiSm]}>{emoji}</Text>
        ) : (
          <Text style={[styles.emptyMark, compact && styles.emptyMarkSm]}>·</Text>
        )}
      </View>
      <Text
        style={[styles.dayLabel, compact && styles.dayLabelCompact, total > 14 && styles.dayLabelMonth]}
        numberOfLines={1}
      >
        {dateLabel}
      </Text>
    </View>
  );
}

export function MiniMoodTimeline({ days, monthNames, period }: MiniMoodTimelineProps) {
  const { t } = useI18n();
  const withCheckIn = days.filter((d) => d.hasCheckIn).length;
  const isExtended = days.length > 7;
  const columns = gridColumns(days.length);
  const rows = chunkRows(days, columns);

  if (days.length === 0) return null;

  return (
    <View
      style={styles.wrap}
      accessibilityLabel={t('paramiExtra.a11yMoodTimeline', {
        checkIns: withCheckIn,
        total: days.length,
      })}
    >
      {isExtended ? (
        <View style={styles.weekGrid}>
          {rows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.weekBlock}>
              {period === 'twoWeeks' ? (
                <Text style={styles.weekTag}>{t('parami.moodWeekLabel', { n: rowIndex + 1 })}</Text>
              ) : null}
              <View style={styles.weekRow}>
                {row.map((day) => (
                  <MoodFaceCell
                    key={day.date}
                    day={day}
                    compact
                    total={days.length}
                    monthNames={monthNames}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.row}>
          {days.map((day) => (
            <MoodFaceCell
              key={day.date}
              day={day}
              compact={false}
              total={days.length}
              monthNames={monthNames}
            />
          ))}
        </View>
      )}
      <Text style={styles.legend}>
        {days.length >= 30
          ? t('parami.moodTimelineLegendMonth', { count: days.length })
          : days.length === 14
            ? t('parami.moodTimelineLegendFortnight', { count: days.length })
            : t('parami.moodTimelineLegend')}
      </Text>
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
    gap: 4,
  },
  weekGrid: {
    gap: THEME.spacing.sm,
  },
  weekBlock: {
    gap: 4,
  },
  weekTag: {
    ...THEME.typography.meta,
    fontSize: 10,
    color: THEME.colors.onGradientMuted,
    fontFamily: THEME.fonts.heading.bold,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  cellCompact: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
  },
  faceBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 1.5,
  },
  faceBoxSm: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
  },
  faceBoxFilled: {
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  faceBoxEmpty: {
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  emoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  emojiSm: {
    fontSize: 15,
    lineHeight: 18,
  },
  emptyMark: {
    fontSize: 18,
    lineHeight: 22,
    color: THEME.colors.onGradientFaint,
    opacity: 0.5,
  },
  emptyMarkSm: {
    fontSize: 14,
    lineHeight: 16,
  },
  dayLabel: {
    ...THEME.typography.meta,
    fontSize: 10,
    color: THEME.colors.onGradientFaint,
    textAlign: 'center',
  },
  dayLabelCompact: {
    fontSize: 9,
  },
  dayLabelMonth: {
    fontSize: 8,
    lineHeight: 11,
  },
  legend: {
    ...THEME.typography.meta,
    fontSize: 10,
    color: THEME.colors.onGradientFaint,
    textAlign: 'center',
    opacity: 0.9,
    marginTop: 2,
    lineHeight: 15,
  },
});
