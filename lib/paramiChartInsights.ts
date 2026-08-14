import type { DayData } from '@/lib/checkInDayData';
import type { EmotionMixItem } from '@/lib/checkInPatterns';
import type { AppLocale } from '@/lib/i18n';
import { getCatalog, translate } from '@/lib/i18n';

export type ParamiChartInsight = {
  /** Número o fracción corta (estilo Musa: “48%”, “2.4”). */
  highlight: string;
  /** Frase personal que interpreta el gráfico — no comunidad genérica. */
  text: string;
};

function emotionLabel(locale: AppLocale, emotion: string): string {
  const emotions = getCatalog(locale).sentir.emotions as Record<string, string>;
  return emotions[emotion.toLowerCase()] ?? emotion;
}

function formatAvg(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/**
 * Pie de ánimo: cuántos días hay señal + emoción dominante.
 * Equivalente Koraa al “% Musers en fase X” de Musa, pero sobre TU dato.
 */
export function buildMoodChartInsight(
  days: DayData[],
  locale: AppLocale,
): ParamiChartInsight | null {
  const withMood = days.filter((d) => d.hasCheckIn && d.emotion);
  if (withMood.length === 0) return null;

  const highlight = `${withMood.length}/${days.length}`;
  const counts = new Map<string, number>();
  for (const day of withMood) {
    const key = (day.emotion ?? '').toLowerCase();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
  if (!top) {
    return {
      highlight,
      text: translate(locale, 'parami.chartMoodInsightPlain', {
        checkIns: withMood.length,
        total: days.length,
      }),
    };
  }

  const pct = Math.round((top[1] / withMood.length) * 100);
  return {
    highlight,
    text: translate(locale, 'parami.chartMoodInsight', {
      emotion: emotionLabel(locale, top[0]),
      pct,
      count: top[1],
    }),
  };
}

/**
 * Pie de energía: promedio + cuántos días pidieron frenar (≤2).
 */
export function buildEnergyChartInsight(
  days: DayData[],
  locale: AppLocale,
): ParamiChartInsight | null {
  const withEnergy = days.filter(
    (d) => d.hasCheckIn && d.energyLevel != null && d.energyLevel > 0,
  );
  if (withEnergy.length === 0) return null;

  const avg =
    withEnergy.reduce((sum, d) => sum + (d.energyLevel ?? 0), 0) / withEnergy.length;
  const lowDays = withEnergy.filter((d) => (d.energyLevel ?? 0) <= 2).length;
  const highlight = formatAvg(avg);

  if (lowDays === 0) {
    return {
      highlight,
      text: translate(locale, 'parami.chartEnergyInsightSteady', {
        avg: highlight,
        checkIns: withEnergy.length,
      }),
    };
  }

  return {
    highlight,
    text: translate(locale, 'parami.chartEnergyInsightLow', {
      avg: highlight,
      lowDays,
      checkIns: withEnergy.length,
    }),
  };
}

/**
 * Pie de emociones: % de la emoción #1 en el periodo.
 */
export function buildEmotionChartInsight(
  mix: EmotionMixItem[],
  checkInCount: number,
  locale: AppLocale,
): ParamiChartInsight | null {
  const top = mix[0];
  if (!top || checkInCount <= 0) return null;
  const pct = Math.round((top.count / checkInCount) * 100);
  return {
    highlight: `${pct}%`,
    text: translate(locale, 'parami.chartEmotionInsight', {
      emotion: emotionLabel(locale, top.id),
      count: top.count,
      pct,
    }),
  };
}
