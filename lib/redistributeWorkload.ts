/**
 * Reparte tareas en el calendario hasta una fecha de entrega,
 * respetando un máximo aproximado de tareas por día (energía / tiempo / emoción).
 */

export function computeMaxTasksPerDay(
  energyLevel: number,
  availableTime: string,
  emotion: string
): number {
  const neg = ['agotada', 'ansiosa', 'abrumada'].includes(emotion.toLowerCase());
  let base = 4;
  if (energyLevel <= 2 || neg) base = 2;
  else if (energyLevel === 3) base = 3;
  else if (energyLevel >= 4) base = 6;

  if (availableTime.includes('Poco')) base = Math.max(1, Math.floor(base * 0.75));
  if (availableTime.includes('Todo el día')) base = Math.min(10, base + 2);
  return base;
}

export function parseISODateOnly(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

export function enumerateDaysInclusive(start: Date, end: Date): string[] {
  const out: string[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endNorm = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= endNorm) {
    out.push(toISODateLocal(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export type RedistributionResult = {
  assignments: { id: string; scheduled_date: string }[];
  warning?: string;
};

/**
 * Reparte taskIds en orden en los días [today, dueDate], hasta `maxPerDay` por día
 * excepto el último día, que absorbe el resto (todo listo para la entrega).
 */
export function redistributeTaskDates(
  taskIds: string[],
  dueDateStr: string,
  todayStr: string,
  maxPerDay: number
): RedistributionResult {
  const due = parseISODateOnly(dueDateStr);
  const today = parseISODateOnly(todayStr);
  if (!due || !today) {
    return { assignments: [], warning: 'Usa la fecha como AAAA-MM-DD (ej. 2026-04-15).' };
  }
  if (due < today) {
    return { assignments: [], warning: 'La fecha de entrega no puede ser antes de hoy.' };
  }

  const days = enumerateDaysInclusive(today, due);
  const n = taskIds.length;
  if (n === 0) return { assignments: [] };

  const dCount = days.length;
  const minDaysNeeded = Math.ceil(n / Math.max(1, maxPerDay));
  let warning: string | undefined;
  if (minDaysNeeded > dCount) {
    warning = `Hay ${n} tareas y un ritmo de ~${maxPerDay} por día: en ${dCount} día(s) el último día quedará cargado. Considera mover la entrega o dividir el trabajo.`;
  }

  const assignments: { id: string; scheduled_date: string }[] = [];
  let taskIdx = 0;
  for (let di = 0; di < days.length && taskIdx < n; di++) {
    const isLast = di === days.length - 1;
    const remaining = n - taskIdx;
    const take = isLast ? remaining : Math.min(maxPerDay, remaining);
    for (let j = 0; j < take; j++) {
      assignments.push({ id: taskIds[taskIdx++], scheduled_date: days[di] });
    }
  }
  return { assignments, warning };
}

/** Reparte tareas sueltas en los próximos `horizonDays` días (incluye hoy). */
export function redistributeLooseTasks(
  taskIds: string[],
  horizonDays: number,
  todayStr: string,
  maxPerDay: number
): RedistributionResult {
  const today = parseISODateOnly(todayStr);
  if (!today) {
    return { assignments: [], warning: 'Fecha de hoy inválida.' };
  }
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  end.setDate(end.getDate() + Math.max(1, horizonDays) - 1);
  const dueStr = toISODateLocal(end);
  return redistributeTaskDates(taskIds, dueStr, todayStr, maxPerDay);
}
