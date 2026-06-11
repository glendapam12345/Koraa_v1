import type { DayData } from '@/lib/checkInDayData';
import type { AppLocale } from '@/lib/i18n';
import { getCatalog, translate } from '@/lib/i18n';
import { generateEmotionalInsights } from '@/lib/emotionalInsights';
import type { EmotionMixItem } from '@/lib/checkInPatterns';
import type { ParaMiPeriodId } from '@/components/parami/ParaMiPeriodBar';

export type ParamiPatternInsight = {
  headline: string;
  summary: string;
  patternNote: string;
  gentleTip: string;
};

export type ParamiPatternInput = {
  locale: AppLocale;
  period: ParaMiPeriodId;
  days: DayData[];
  emotionMix: EmotionMixItem[];
};

function periodLabel(locale: AppLocale, period: ParaMiPeriodId): string {
  const key =
    period === 'month'
      ? 'parami.periodMonth'
      : period === 'twoWeeks'
        ? 'parami.periodTwoWeeks'
        : 'parami.periodWeek';
  return translate(locale, key);
}

function emotionLabel(locale: AppLocale, emotion: string): string {
  const emotions = getCatalog(locale).sentir.emotions as Record<string, string>;
  const key = emotion.toLowerCase();
  return emotions[key] ?? emotion;
}

/** Resumen local empático cuando la IA no está disponible. */
export function buildParamiPatternInsight(input: ParamiPatternInput): ParamiPatternInsight {
  const { locale, period, days, emotionMix } = input;
  const checkIns = days.filter((d) => d.hasCheckIn);
  const periodName = periodLabel(locale, period);
  const insights = generateEmotionalInsights(days, 0, locale);

  const topEmotion = emotionMix[0];
  const topLabel = topEmotion ? emotionLabel(locale, topEmotion.id) : null;

  const avgEnergy =
    checkIns.length > 0
      ? checkIns.reduce((sum, d) => sum + (d.energyLevel ?? 0), 0) / checkIns.length
      : 0;

  const headline =
    locale === 'en'
      ? `Your rhythm over ${periodName.toLowerCase()}`
      : `Tu ritmo en ${periodName.toLowerCase()}`;

  let summary: string;
  if (checkIns.length < 3) {
    summary =
      locale === 'en'
        ? 'A few more check-ins and Koraa can describe your patterns more clearly.'
        : 'Con unos check-ins más, Koraa podrá describir tus patrones con más claridad.';
  } else if (topLabel) {
    summary =
      locale === 'en'
        ? `You checked in ${checkIns.length} times. ${topLabel} showed up most often — every day counts, not just the easy ones.`
        : `Registraste ${checkIns.length} días. ${topLabel} apareció con más frecuencia — cuentan todos los días, no solo los livianos.`;
  } else {
    summary =
      locale === 'en'
        ? `You showed up ${checkIns.length} times. That consistency already says something gentle about your rhythm.`
        : `Volviste ${checkIns.length} veces. Esa constancia suave ya dice algo de tu ritmo.`;
  }

  const patternNote =
    insights[0]?.message ??
    (avgEnergy >= 3.5
      ? locale === 'en'
        ? 'Your energy stayed mostly steady — room for small steps without pushing.'
        : 'Tu energía se mantuvo bastante estable — hay espacio para pasos pequeños sin forzar.'
      : locale === 'en'
        ? 'Some days asked for more rest — listening to that is part of the pattern too.'
        : 'Algunos días pidieron más descanso — escuchar eso también es parte del patrón.');

  const gentleTip =
    insights[1]?.message ??
    (locale === 'en'
      ? 'One minute in Hoy tomorrow is enough. No streak pressure — just your pace.'
      : 'Un minuto en Hoy mañana basta. Sin presión de racha — solo tu ritmo.');

  return { headline, summary, patternNote, gentleTip };
}

/** Payload compacto para la Edge Function. */
export function buildParamiPatternPayload(input: ParamiPatternInput) {
  const checkIns = input.days.filter((d) => d.hasCheckIn);
  const avgEnergy =
    checkIns.length > 0
      ? Math.round(
          (checkIns.reduce((sum, d) => sum + (d.energyLevel ?? 0), 0) / checkIns.length) * 10,
        ) / 10
      : 0;

  return {
    locale: input.locale,
    period: input.period,
    checkInCount: checkIns.length,
    avgEnergy,
    topEmotions: input.emotionMix.map((e) => ({
      key: e.id,
      count: e.count,
    })),
    days: checkIns.map((d) => ({
      date: d.date,
      emotion: d.emotion ?? '',
      energy: d.energyLevel ?? 0,
      label: d.dayLabel,
    })),
  };
}
