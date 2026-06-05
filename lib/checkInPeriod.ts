import type { DayData } from '@/components/ProgressChart';
import type { ParaMiPeriodId } from '@/components/parami/ParaMiMusaHeader';

export function periodDayCount(period: ParaMiPeriodId): number {
  if (period === 'month') return 30;
  if (period === 'twoWeeks') return 14;
  return 7;
}

export function slicePeriodData(data: DayData[], period: ParaMiPeriodId): DayData[] {
  const days = periodDayCount(period);
  return data.slice(-days);
}
