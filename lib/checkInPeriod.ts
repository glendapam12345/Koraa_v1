import type { DayData } from '@/lib/checkInDayData';
import type { ParaMiPeriodId } from '@/components/parami/ParaMiPeriodBar';

export function periodDayCount(period: ParaMiPeriodId): number {
  if (period === 'month') return 30;
  if (period === 'twoWeeks') return 14;
  return 7;
}

export function slicePeriodData(data: DayData[], period: ParaMiPeriodId): DayData[] {
  const days = periodDayCount(period);
  if (data.length >= days) {
    return data.slice(-days);
  }
  return data;
}
