import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { DayData } from '@/lib/checkInDayData';
import type { ParaMiPeriodId } from '@/components/parami/ParaMiPeriodBar';
import {
  averageEnergyFromDays,
  buildEnergyTimeline,
  chunkEnergyRows,
  energyBarsChronological,
  energyGridColumns,
  energyLevelKey,
  periodLabelKey,
  valuesToEnergyBars,
  type EnergyBar,
} from '@/lib/energyChart';

type MiniSparklineChartProps = {
  days?: DayData[];
  values?: number[];
  maxValue?: number;
  monthNames?: readonly string[];
  period?: ParaMiPeriodId;
  variant?: 'default' | 'onGradient';
};

const CELL_BAR_HEIGHT = 28;

function EnergyGridCell({
  bar,
  max,
  onGradient,
  compact,
}: {
  bar: EnergyBar;
  max: number;
  onGradient: boolean;
  compact: boolean;
}) {
  const fillH = bar.hasCheckIn && bar.energy != null
    ? Math.max(4, Math.round((bar.energy / max) * CELL_BAR_HEIGHT))
    : 0;
  const trackColor = onGradient ? 'rgba(255,255,255,0.2)' : THEME.colors.fill[200];
  const fillColor = onGradient ? THEME.colors.onGradient : THEME.colors.calm.lavenderDeep;
  const labelColor = onGradient ? THEME.colors.onGradientFaint : THEME.colors.text.tertiary;
  const scoreColor = onGradient ? THEME.colors.onGradientMuted : THEME.colors.calm.lavenderDeep;

  return (
    <View style={[styles.gridCell, compact && styles.gridCellCompact]}>
      <View style={[styles.gridTrack, { height: CELL_BAR_HEIGHT, backgroundColor: trackColor }]}>
        {bar.hasCheckIn ? (
          <View style={[styles.gridFill, { height: fillH, backgroundColor: fillColor, opacity: onGradient ? 0.9 : 0.85 }]} />
        ) : (
          <Text style={[styles.gridEmpty, onGradient && styles.gridEmptyOnGradient]}>·</Text>
        )}
      </View>
      {bar.hasCheckIn && bar.energy != null ? (
        <Text style={[styles.gridScore, { color: scoreColor }]}>{bar.energy}</Text>
      ) : (
        <Text style={[styles.gridScore, styles.gridScoreEmpty, { color: labelColor }]}>—</Text>
      )}
      <Text style={[styles.gridLabel, { color: labelColor }, compact && styles.gridLabelCompact]} numberOfLines={1}>
        {bar.dayLabel}
      </Text>
    </View>
  );
}

function EnergyWeekList({
  bars,
  max,
  onGradient,
}: {
  bars: EnergyBar[];
  max: number;
  onGradient: boolean;
}) {
  const { t } = useI18n();
  const labelColor = onGradient ? THEME.colors.onGradientMuted : THEME.colors.text.main;
  const trackColor = onGradient ? 'rgba(255,255,255,0.22)' : THEME.colors.fill[200];
  const fillColor = onGradient ? THEME.colors.onGradient : THEME.colors.calm.lavenderDeep;
  const scoreColor = onGradient ? THEME.colors.onGradient : THEME.colors.calm.lavenderDeep;
  const mutedColor = onGradient ? THEME.colors.onGradientFaint : THEME.colors.text.tertiary;

  return (
    <View style={styles.rows}>
      {bars.map((bar) => {
        if (!bar.hasCheckIn || bar.energy == null) {
          return (
            <View key={bar.key} style={styles.row}>
              <Text style={[styles.dateLabel, { color: mutedColor }]} numberOfLines={1}>
                {bar.dayLabel}
              </Text>
              <View style={[styles.track, styles.trackEmpty, { backgroundColor: trackColor }]}>
                <Text style={[styles.noCheckIn, { color: mutedColor }]}>{t('parami.energyNoCheckIn')}</Text>
              </View>
              <Text style={[styles.score, styles.scoreEmpty, { color: mutedColor }]}>—</Text>
            </View>
          );
        }
        const widthPct = Math.max(10, Math.round((bar.energy / max) * 100));
        return (
          <View key={bar.key} style={styles.row}>
            <Text style={[styles.dateLabel, { color: labelColor }]} numberOfLines={1}>
              {bar.dayLabel}
            </Text>
            <View style={[styles.track, { backgroundColor: trackColor }]}>
              <View
                style={[
                  styles.fill,
                  { width: `${widthPct}%`, backgroundColor: fillColor, opacity: onGradient ? 0.9 : 0.85 },
                ]}
              />
            </View>
            <Text style={[styles.score, { color: scoreColor }]}>{bar.energy}/5</Text>
          </View>
        );
      })}
    </View>
  );
}

export function MiniSparklineChart({
  days,
  values,
  maxValue = 5,
  monthNames,
  period = 'week',
  variant = 'default',
}: MiniSparklineChartProps) {
  const { t } = useI18n();
  const onGradient = variant === 'onGradient';
  const max = Math.max(maxValue, 1);
  const periodName = t(periodLabelKey(period));

  const bars = useMemo(() => {
    if (days?.length && monthNames) {
      return buildEnergyTimeline(days, monthNames, period);
    }
    if (days?.length && monthNames === undefined) {
      return buildEnergyTimeline(days, [], period);
    }
    return energyBarsChronological(valuesToEnergyBars(values ?? []));
  }, [days, values, monthNames, period]);

  const periodAverage = useMemo(
    () => (days?.length ? averageEnergyFromDays(days.slice(-bars.length)) : null),
    [bars.length, days],
  );

  const checkInCount = bars.filter((b) => b.hasCheckIn).length;

  if (bars.length === 0) return null;

  const levelKey = periodAverage != null ? energyLevelKey(periodAverage) : null;
  const useGrid = period !== 'week' && bars.length > 7;
  const columns = energyGridColumns(bars.length);
  const rows = chunkEnergyRows(bars, columns);
  const legendColor = onGradient ? THEME.colors.onGradientFaint : THEME.colors.text.tertiary;

  return (
    <View style={styles.wrap}>
      {periodAverage != null && levelKey ? (
        <Text style={[styles.summary, onGradient && styles.summaryOnGradient]}>
          {t('parami.energyChartSummaryInPeriod', {
            period: periodName,
            avg: periodAverage,
            level: t(`parami.${levelKey}`),
          })}
        </Text>
      ) : checkInCount === 0 ? (
        <Text style={[styles.summary, styles.summaryMuted, onGradient && styles.summaryOnGradient]}>
          {t('parami.energyChartNoCheckIns', { period: periodName })}
        </Text>
      ) : null}

      {useGrid ? (
        <View style={styles.gridWrap}>
          {rows.map((row, rowIndex) => (
            <View key={`energy-row-${rowIndex}`} style={styles.gridRowBlock}>
              {period === 'twoWeeks' ? (
                <Text style={[styles.weekTag, onGradient && styles.weekTagOnGradient]}>
                  {t('parami.energyWeekLabel', { n: rowIndex + 1 })}
                </Text>
              ) : period === 'month' && row.length > 0 ? (
                <Text style={[styles.weekTag, onGradient && styles.weekTagOnGradient]}>
                  {t('parami.energyMonthRowLabel', {
                    start: row[0]!.dayLabel,
                    end: row[row.length - 1]!.dayLabel,
                  })}
                </Text>
              ) : null}
              <View style={styles.gridRow}>
                {row.map((bar) => (
                  <EnergyGridCell
                    key={bar.key}
                    bar={bar}
                    max={max}
                    onGradient={onGradient}
                    compact={bars.length >= 30}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <EnergyWeekList bars={bars} max={max} onGradient={onGradient} />
      )}

      <Text style={[styles.legend, { color: legendColor }, onGradient && styles.legendOnGradient]}>
        {period === 'month'
          ? t('parami.energyGridLegendMonth', { days: bars.length, checkIns: checkInCount })
          : period === 'twoWeeks'
            ? t('parami.energyGridLegendFortnight', { days: bars.length, checkIns: checkInCount })
            : t('parami.energyGridLegendWeek', { checkIns: checkInCount, days: bars.length })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  summary: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 20,
  },
  summaryOnGradient: {
    color: THEME.colors.onGradient,
    textAlign: 'center',
  },
  summaryMuted: {
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  rows: {
    gap: THEME.spacing.xs,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  dateLabel: {
    ...THEME.typography.small,
    width: 36,
    fontFamily: THEME.fonts.heading.medium,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  trackEmpty: {
    alignItems: 'center',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  noCheckIn: {
    ...THEME.typography.meta,
    fontSize: 9,
    textAlign: 'center',
  },
  score: {
    ...THEME.typography.small,
    width: 32,
    textAlign: 'right',
    fontFamily: THEME.fonts.heading.bold,
  },
  scoreEmpty: {
    fontFamily: THEME.fonts.heading.medium,
  },
  gridWrap: {
    gap: THEME.spacing.sm,
    marginTop: 2,
  },
  gridRowBlock: {
    gap: 4,
  },
  weekTag: {
    ...THEME.typography.meta,
    fontSize: 10,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.bold,
  },
  weekTagOnGradient: {
    color: THEME.colors.onGradientMuted,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  gridCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
  },
  gridCellCompact: {
    gap: 1,
  },
  gridTrack: {
    width: '100%',
    maxWidth: 28,
    borderRadius: THEME.borderRadius.standard,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gridFill: {
    width: '100%',
    borderRadius: THEME.borderRadius.standard,
  },
  gridEmpty: {
    fontSize: 14,
    lineHeight: CELL_BAR_HEIGHT,
    color: THEME.colors.text.tertiary,
    opacity: 0.6,
  },
  gridEmptyOnGradient: {
    color: THEME.colors.onGradientFaint,
  },
  gridScore: {
    ...THEME.typography.meta,
    fontSize: 10,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 12,
  },
  gridScoreEmpty: {
    fontFamily: THEME.fonts.heading.medium,
    opacity: 0.7,
  },
  gridLabel: {
    ...THEME.typography.meta,
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 11,
  },
  gridLabelCompact: {
    fontSize: 8,
    lineHeight: 10,
  },
  legend: {
    ...THEME.typography.meta,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  legendOnGradient: {
    textAlign: 'center',
  },
});
