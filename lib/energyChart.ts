import type { DayData } from '@/lib/checkInDayData';
import type { ParaMiPeriodId } from '@/components/parami/ParaMiPeriodBar';
import { periodDayCount } from '@/lib/checkInPeriod';

export type EnergyBar = {
  key: string;
  energy: number | null;
  dayLabel: string;
  hasCheckIn: boolean;
};

export function periodLabelKey(
  period: ParaMiPeriodId,
): 'parami.periodWeek' | 'parami.periodTwoWeeks' | 'parami.periodMonth' {
  if (period === 'month') return 'parami.periodMonth';
  if (period === 'twoWeeks') return 'parami.periodTwoWeeks';
  return 'parami.periodWeek';
}

export function formatCheckInDateLabel(date: string, monthNames: readonly string[]): string {
  const dayNum = parseInt(date.slice(8, 10), 10);
  const month = monthNames[parseInt(date.slice(5, 7), 10) - 1] ?? '';
  return month ? `${dayNum} ${month}` : String(dayNum);
}

function shortWeekdayLabel(day: DayData): string {
  const trimmed = day.dayLabel.trim();
  if (trimmed.length <= 3) return trimmed;
  return trimmed.slice(0, 3);
}

/** Un punto por cada día del periodo (incluye días sin check-in). */
export function buildEnergyTimeline(
  days: DayData[],
  monthNames: readonly string[],
  period: ParaMiPeriodId,
): EnergyBar[] {
  const expected = periodDayCount(period);
  const slice = days.length === expected ? days : days.slice(-expected);

  return slice.map((day) => {
    const hasCheckIn = Boolean(day.hasCheckIn && day.energyLevel != null && day.energyLevel > 0);
    return {
      key: day.date,
      energy: hasCheckIn ? day.energyLevel! : null,
      hasCheckIn,
      dayLabel:
        period === 'week'
          ? shortWeekdayLabel(day)
          : formatCheckInDateLabel(day.date, monthNames),
    };
  });
}

export function averageEnergyFromDays(days: DayData[]): number | null {
  const withEnergy = days.filter(
    (day) => day.hasCheckIn && day.energyLevel != null && day.energyLevel > 0,
  );
  if (withEnergy.length === 0) return null;
  const sum = withEnergy.reduce((acc, day) => acc + (day.energyLevel ?? 0), 0);
  return Math.round((sum / withEnergy.length) * 10) / 10;
}

export function energyLevelKey(avg: number): 'energySummaryLow' | 'energySummaryMid' | 'energySummaryHigh' {
  if (avg < 2.5) return 'energySummaryLow';
  if (avg < 3.5) return 'energySummaryMid';
  return 'energySummaryHigh';
}

export function valuesToEnergyBars(values: number[]): EnergyBar[] {
  return values.map((energy, index) => ({
    key: `v-${index}`,
    energy: energy > 0 ? energy : null,
    hasCheckIn: energy > 0,
    dayLabel: '',
  }));
}

export function energyGridColumns(dayCount: number): number {
  if (dayCount <= 7) return dayCount;
  if (dayCount <= 14) return 7;
  return 6;
}

export function chunkEnergyRows<T>(items: T[], columns: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
}

/** Lista cronológica (antiguo → reciente) para la vista semanal. */
export function energyBarsChronological(bars: EnergyBar[]): EnergyBar[] {
  return bars;
}
