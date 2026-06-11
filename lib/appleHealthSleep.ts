/** Horas por debajo de las cuales suavizamos sugerencias (sin culpa). */
export const SHORT_SLEEP_HOURS = 6;

export type SleepSample = {
  startDate: string;
  endDate: string;
  value: string;
};

export type LastNightSleepSummary = {
  hours: number;
  isShort: boolean;
  windowStart: string;
  windowEnd: string;
};

const ASLEEP_VALUES = new Set(['ASLEEP', 'CORE', 'DEEP', 'REM']);

function sampleDurationMs(sample: SleepSample): number {
  const start = new Date(sample.startDate).getTime();
  const end = new Date(sample.endDate).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return end - start;
}

/** Ventana típica de “anoche”: desde ayer 18:00 hasta ahora (o hoy 14:00). */
export function getLastNightSleepWindow(now: Date = new Date()): { start: Date; end: Date } {
  const end = new Date(now);
  if (end.getHours() >= 14) {
    end.setHours(14, 0, 0, 0);
  }

  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(18, 0, 0, 0);

  return { start, end };
}

export function sumSleepDurationMs(samples: SleepSample[]): number {
  const asleep = samples.filter((s) => ASLEEP_VALUES.has(s.value.toUpperCase()));
  if (asleep.length > 0) {
    return asleep.reduce((sum, s) => sum + sampleDurationMs(s), 0);
  }

  const inBed = samples.filter((s) => s.value.toUpperCase() === 'INBED');
  if (inBed.length === 0) return 0;

  return Math.max(...inBed.map(sampleDurationMs));
}

export function msToSleepHours(ms: number): number {
  if (ms <= 0) return 0;
  return Math.round((ms / 3_600_000) * 10) / 10;
}

export function isShortSleep(hours: number): boolean {
  return hours > 0 && hours < SHORT_SLEEP_HOURS;
}

export function formatSleepHours(hours: number, locale: 'es' | 'en' = 'es'): string {
  const rounded = Math.round(hours * 10) / 10;
  const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return locale === 'en' ? `${str} h` : `${str} h`;
}

export function summarizeLastNightSleep(
  samples: SleepSample[],
  now: Date = new Date(),
): LastNightSleepSummary | null {
  const { start, end } = getLastNightSleepWindow(now);
  const startMs = start.getTime();
  const endMs = end.getTime();

  const inWindow = samples.filter((s) => {
    const sStart = new Date(s.startDate).getTime();
    const sEnd = new Date(s.endDate).getTime();
    return sEnd > startMs && sStart < endMs;
  });

  const totalMs = sumSleepDurationMs(inWindow);
  const hours = msToSleepHours(totalMs);
  if (hours <= 0) return null;

  return {
    hours,
    isShort: isShortSleep(hours),
    windowStart: start.toISOString(),
    windowEnd: end.toISOString(),
  };
}
