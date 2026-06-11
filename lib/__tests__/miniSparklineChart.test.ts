import {
  buildEnergyTimeline,
  chunkEnergyRows,
  energyGridColumns,
  formatCheckInDateLabel,
} from '@/lib/energyChart';
import type { DayData } from '@/lib/checkInDayData';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun'] as const;

function day(date: string, energy: number, label: string): DayData {
  return {
    date,
    hasCheckIn: true,
    dayLabel: label,
    energyLevel: energy,
  };
}

describe('energyChart', () => {
  describe('formatCheckInDateLabel', () => {
    it('formats as day number plus month abbreviation', () => {
      expect(formatCheckInDateLabel('2026-06-10', MONTHS)).toBe('10 jun');
      expect(formatCheckInDateLabel('2026-05-26', MONTHS)).toBe('26 may');
    });
  });

  describe('buildEnergyTimeline', () => {
    it('includes every day in the period, even without check-in', () => {
      const days: DayData[] = [
        day('2026-06-01', 3, 'lun'),
        { date: '2026-06-02', hasCheckIn: false, dayLabel: 'mar' },
        day('2026-06-03', 4, 'mié'),
      ];
      const result = buildEnergyTimeline(days, MONTHS, 'week');
      expect(result).toHaveLength(3);
      expect(result[1]).toMatchObject({ hasCheckIn: false, energy: null });
    });

    it('returns exactly 14 slots for two weeks', () => {
      const days = Array.from({ length: 20 }, (_, i) =>
        day(`2026-06-${String(i + 1).padStart(2, '0')}`, 3, 'lun'),
      );
      expect(buildEnergyTimeline(days, MONTHS, 'twoWeeks')).toHaveLength(14);
    });

    it('returns exactly 30 slots for month', () => {
      const days = Array.from({ length: 30 }, (_, i) => {
        const d = i + 1;
        return day(`2026-05-${String(d).padStart(2, '0')}`, 2, 'lun');
      });
      expect(buildEnergyTimeline(days, MONTHS, 'month')).toHaveLength(30);
    });
  });

  describe('energyGridColumns', () => {
    it('uses 7 columns for fortnight and 6 for month', () => {
      expect(energyGridColumns(7)).toBe(7);
      expect(energyGridColumns(14)).toBe(7);
      expect(energyGridColumns(30)).toBe(6);
      expect(chunkEnergyRows(Array.from({ length: 14 }), 7)).toHaveLength(2);
      expect(chunkEnergyRows(Array.from({ length: 30 }), 6)).toHaveLength(5);
    });
  });
});
