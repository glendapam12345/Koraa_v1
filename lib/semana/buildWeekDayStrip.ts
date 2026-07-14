import { getLocalDateString, parseLocalDateString } from '@/lib/dateLocal';
import { getWeekMonday } from '@/lib/semana/rangeMode';

export type SemanaStripDay = {
  dateStr: string;
  dayNum: number;
  weekdayIndex: number;
  energyLevel: number | null;
  taskCount: number;
  isToday: boolean;
};

export function buildSemanaWeekStrip(
  selectedDate: string,
  todayStr: string,
  checkIns: Record<string, { energy_level?: number | null } | undefined>,
  taskCountByDate: Record<string, number>,
): SemanaStripDay[] {
  const monday = getWeekMonday(selectedDate);
  const start = parseLocalDateString(monday);
  const days: SemanaStripDay[] = [];

  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = getLocalDateString(d);
    const checkIn = checkIns[dateStr];
    const energy =
      checkIn?.energy_level != null && checkIn.energy_level > 0
        ? checkIn.energy_level
        : null;

    days.push({
      dateStr,
      dayNum: d.getDate(),
      weekdayIndex: d.getDay(),
      energyLevel: energy,
      taskCount: taskCountByDate[dateStr] ?? 0,
      isToday: dateStr === todayStr,
    });
  }

  return days;
}
