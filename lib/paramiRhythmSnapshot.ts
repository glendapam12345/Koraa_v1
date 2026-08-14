import type { DayData } from '@/lib/checkInDayData';
import type { AppLocale } from '@/lib/i18n';
import { translate } from '@/lib/i18n';

/** Bandas suaves — no “notas”, no culpa. */
export type RhythmLevelId = 'soft' | 'steady' | 'mixed' | 'tender';
export type RhythmBandId = 'low' | 'mid' | 'high';

export type ParamiRhythmSnapshot = {
  score: number;
  level: RhythmLevelId;
  levelLabel: string;
  moodBand: RhythmBandId;
  moodLabel: string;
  energyBand: RhythmBandId;
  energyLabel: string;
  checkInCount: number;
};

/** 0–1: más alto = más liviano / menos carga emocional. */
const EMOTION_EASE: Record<string, number> = {
  tranquila: 1,
  enfocada: 0.85,
  motivada: 0.9,
  ansiosa: 0.35,
  agotada: 0.25,
  abrumada: 0.15,
  cansada: 0.3,
  triste: 0.25,
  feliz: 0.95,
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function energyBand(avg: number): RhythmBandId {
  if (avg <= 2.25) return 'low';
  if (avg >= 3.75) return 'high';
  return 'mid';
}

function moodBand(ease: number): RhythmBandId {
  if (ease <= 0.4) return 'low';
  if (ease >= 0.75) return 'high';
  return 'mid';
}

function levelFromScore(score: number): RhythmLevelId {
  if (score >= 72) return 'soft';
  if (score >= 55) return 'steady';
  if (score >= 38) return 'mixed';
  return 'tender';
}

/**
 * Snapshot del periodo (ánimo + energía) — equivalente calmado al “nivel de balance” de Musa.
 * Requiere al menos 2 check-ins; sin fases ni síntomas.
 */
export function buildParamiRhythmSnapshot(
  days: DayData[],
  locale: AppLocale,
  minCheckIns = 2,
): ParamiRhythmSnapshot | null {
  const checkIns = days.filter((d) => d.hasCheckIn);
  if (checkIns.length < minCheckIns) return null;

  const energies = checkIns
    .map((d) => d.energyLevel)
    .filter((n): n is number => typeof n === 'number' && n > 0);
  const eases = checkIns
    .map((d) => {
      const key = (d.emotion ?? '').toLowerCase();
      return key ? (EMOTION_EASE[key] ?? 0.5) : null;
    })
    .filter((n): n is number => n != null);

  if (energies.length === 0 && eases.length === 0) return null;

  const avgEnergy = energies.length > 0 ? average(energies) : 3;
  const avgEase = eases.length > 0 ? average(eases) : 0.5;

  // Energía 1–5 → 0–100; ease 0–1 → 0–100. Mitad y mitad.
  const energyScore = ((avgEnergy - 1) / 4) * 100;
  const moodScore = avgEase * 100;
  const score = Math.round(
    Math.min(100, Math.max(0, energyScore * 0.5 + moodScore * 0.5)),
  );

  const level = levelFromScore(score);
  const mood = moodBand(avgEase);
  const energy = energyBand(avgEnergy);

  return {
    score,
    level,
    levelLabel: translate(locale, `parami.rhythmLevel.${level}`),
    moodBand: mood,
    moodLabel: translate(locale, `parami.rhythmMood.${mood}`),
    energyBand: energy,
    energyLabel: translate(locale, `parami.rhythmEnergy.${energy}`),
    checkInCount: checkIns.length,
  };
}
