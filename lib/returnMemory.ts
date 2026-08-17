import type { TranslationKey } from '@/lib/i18n';
import { parseLocalDateString, normalizeScheduledDate } from '@/lib/dateLocal';
import { resolveEllieCompanionCue, type EllieMood } from '@/lib/elliePersonality';

export type ReturnMemory = {
  emotionKey: string;
  energyLevel: number;
  daysSince: number;
};

export type ReturnMemoryCue = {
  messageKey: TranslationKey;
  mood: EllieMood;
};

export type CheckInMemoryRow = {
  date?: string | null;
  emotion?: string | null;
  energy_level?: number | null;
  available_time?: string | null;
  focus_level?: string | null;
};

export type ParsedRecentCheckIns = {
  today: {
    emotion: string;
    energyLevel: number;
    time: string;
    focusLevel: string;
  } | null;
  memory: ReturnMemory | null;
};

const HEAVY_EMOTIONS = new Set(['abrumada', 'ansiosa']);
/** Más de una semana: no fingir que “ayer” sigue fresco. */
const MAX_MEMORY_DAYS = 6;

function daysBetween(fromDay: string, toDay: string): number {
  const a = parseLocalDateString(fromDay).getTime();
  const b = parseLocalDateString(toDay).getTime();
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

function normalizeEmotion(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

/**
 * Separa el check-in de hoy y la visita anterior (para que Koraa recuerde).
 * `rows` deben ir de más reciente a más antigua.
 */
export function parseRecentCheckIns(
  rows: CheckInMemoryRow[],
  today: string,
): ParsedRecentCheckIns {
  let todayRow: CheckInMemoryRow | null = null;
  let pastRow: CheckInMemoryRow | null = null;

  for (const row of rows) {
    const day = normalizeScheduledDate(row.date);
    if (!day) continue;
    if (day === today) {
      if (!todayRow) todayRow = row;
      continue;
    }
    if (day < today && !pastRow) {
      pastRow = row;
    }
  }

  const todayEmotion = normalizeEmotion(todayRow?.emotion);
  const todayParsed = todayRow && todayEmotion
    ? {
        emotion: todayRow.emotion!.trim(),
        energyLevel: todayRow.energy_level && todayRow.energy_level > 0 ? todayRow.energy_level : 0,
        time: todayRow.available_time?.trim() || '',
        focusLevel: todayRow.focus_level?.trim() || '',
      }
    : null;

  const pastEmotion = normalizeEmotion(pastRow?.emotion);
  const pastDay = normalizeScheduledDate(pastRow?.date);
  let memory: ReturnMemory | null = null;
  if (pastEmotion && pastDay) {
    const daysSince = daysBetween(pastDay, today);
    if (daysSince >= 1 && daysSince <= MAX_MEMORY_DAYS) {
      memory = {
        emotionKey: pastEmotion,
        energyLevel: pastRow?.energy_level && pastRow.energy_level > 0 ? pastRow.energy_level : 0,
        daysSince,
      };
    }
  }

  return { today: todayParsed, memory };
}

/**
 * Frase de vuelta: solo si aún no hay check-in hoy y hay memoria reciente.
 * Hoy del día gana sobre ayer.
 */
export function resolveReturnMemoryCue(params: {
  hasCheckInToday: boolean;
  memory: ReturnMemory | null;
}): ReturnMemoryCue | null {
  const { hasCheckInToday, memory } = params;
  if (hasCheckInToday || !memory) return null;

  const mood = resolveEllieCompanionCue(memory.emotionKey, memory.energyLevel).mood;

  if (memory.daysSince >= 2) {
    return { messageKey: 'hoy.rememberLastTime', mood };
  }

  if (HEAVY_EMOTIONS.has(memory.emotionKey)) {
    return { messageKey: 'hoy.rememberYesterdayHeavy', mood };
  }
  if (memory.emotionKey === 'agotada' || memory.energyLevel <= 2) {
    return { messageKey: 'hoy.rememberYesterdayLow', mood };
  }
  return { messageKey: 'hoy.rememberYesterday', mood };
}
