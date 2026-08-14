import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { DayData } from '@/lib/checkInDayData';
import { formatCheckInDateLabel, energyGridColumns, chunkEnergyRows } from '@/lib/energyChart';
import { getEmotionCalendarAccent, getEmotionCalendarFill } from '@/lib/emotionCalendarColors';
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
  const accent = day.emotion ? getEmotionCalendarAccent(day.emotion) : THEME.colors.calm.mist;
  const fill = day.emotion ? getEmotionCalendarFill(day.emotion) : THEME.colors.surfaceOverlay.veryFaint;
  const emoji = hasMood ? getEmotionEmoji(day.emotion) : null;
  const dateLabel = labelForDay(day, total, monthNames);

  return (
    <View style={[styles.cell, compact && styles.cellCompact]}>
      <View
        style={[
          compact ? styles.faceBoxSm : styles.faceBox,
          hasMood ? styles.faceBoxFilled : styles.faceBoxEmpty,
          hasMood ? { borderColor: accent, backgroundColor: fill } : undefined,
        ]}
        accessibilityElementsHidden={!hasMood}
      >
        {hasMood ? (
          <Text style={[styles.emoji, compact && styles.emojiSm]}>{emoji}</Text>
        ) : (
          <View style={styles.emptyPlaceholder} />
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
  const withMood = days.filter((d) => d.hasCheckIn && d.emotion).length;
  const isExtended = days.length > 7;
  const columns = gridColumns(days.length);
  const rows = chunkRows(days, columns);

  if (days.length === 0) return null;

  if (withMood === 0) {
    return (
      <Text style={styles.emptyState}>{t('parami.moodTimelineEmpty')}</Text>
    );
  }

  return (
    <View
      style={styles.wrap}
      accessibilityLabel={t('paramiExtra.a11yMoodTimeline', {
        checkIns: withMood,
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
        {withMood < days.length
          ? t('parami.moodTimelineLegendSparse', { checkIns: withMood, total: days.length })
          : days.length >= 30
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
    ...THEME.typography.micro,
    color: THEME.colors.text.secondary,
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
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceOverlay.wash,
    borderWidth: 2,
  },
  faceBoxSm: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceOverlay.washLight,
    borderWidth: 2,
  },
  faceBoxFilled: {},
  faceBoxEmpty: {
    borderColor: THEME.colors.calm.lavender,
    backgroundColor: THEME.colors.calm.card,
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  emptyPlaceholder: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    opacity: 0.35,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  emojiSm: {
    fontSize: 16,
    lineHeight: 20,
  },
  emptyState: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.xs,
  },
  dayLabel: {
    ...THEME.typography.micro,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    fontFamily: THEME.fonts.heading.medium,
  },
  dayLabelCompact: {
    ...THEME.typography.micro,
    color: THEME.colors.text.secondary,
  },
  dayLabelMonth: {
    ...THEME.typography.micro,
    color: THEME.colors.text.secondary,
  },
  legend: {
    ...THEME.typography.micro,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
});
