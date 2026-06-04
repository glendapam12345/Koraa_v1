import { getLocalDateString, parseLocalDateString } from '@/lib/dateLocal';

export type CalendarDayCell = {
  dateStr: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
};

export function getMonthBounds(year: number, monthIndex: number): { start: string; end: string } {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  return {
    start: getLocalDateString(first),
    end: getLocalDateString(last),
  };
}

/** Cuadrícula Lun–Dom (6 filas máx.) para un mes. */
export function buildMonthGrid(year: number, monthIndex: number): CalendarDayCell[] {
  const today = getLocalDateString();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startOffset);

  const cells: CalendarDayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const dateStr = getLocalDateString(d);
    cells.push({
      dateStr,
      dayNumber: d.getDate(),
      inCurrentMonth: d.getMonth() === monthIndex,
      isToday: dateStr === today,
    });
  }
  return cells;
}

export function parseMonthAnchor(anchor: string): { year: number; monthIndex: number } {
  const d = parseLocalDateString(`${anchor.slice(0, 7)}-01`);
  return { year: d.getFullYear(), monthIndex: d.getMonth() };
}

export function shiftMonth(year: number, monthIndex: number, delta: number): { year: number; monthIndex: number } {
  const d = new Date(year, monthIndex + delta, 1);
  return { year: d.getFullYear(), monthIndex: d.getMonth() };
}

export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}
