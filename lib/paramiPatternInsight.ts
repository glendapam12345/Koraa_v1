import type { DayData } from '@/lib/checkInDayData';
import type { AppLocale } from '@/lib/i18n';
import { getCatalog, translate } from '@/lib/i18n';
import { generateEmotionalInsights } from '@/lib/emotionalInsights';
import {
  applyModeForBehaviorType,
  buildBehaviorInsights,
  type BehaviorTaskSnapshot,
  type PatternHoyApplyMode,
} from '@/lib/behaviorInsights';
import type { EmotionMixItem } from '@/lib/checkInPatterns';
import type { ParaMiPeriodId } from '@/components/parami/ParaMiPeriodBar';
import { getLocalDateString } from '@/lib/dateLocal';

export type ParamiPatternInsight = {
  headline: string;
  summary: string;
  patternNote: string;
  gentleTip: string;
  source?: 'feel' | 'work';
  /** Etiqueta corta: correlación ánimo × cierres. */
  correlationLabel?: string;
  /** Cómo aplicar el tip en Hoy. */
  applyMode?: PatternHoyApplyMode;
  patternType?: string;
};

export type ParamiPatternInput = {
  locale: AppLocale;
  period: ParaMiPeriodId;
  days: DayData[];
  emotionMix: EmotionMixItem[];
  tasks?: BehaviorTaskSnapshot[];
  isPremium?: boolean;
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
  const { locale, period, days, emotionMix, tasks = [], isPremium = false } = input;
  const checkIns = days.filter((d) => d.hasCheckIn);
  const periodName = periodLabel(locale, period);
  const feelInsights = generateEmotionalInsights(days, 0, locale);
  const workInsights = buildBehaviorInsights(days, tasks, locale, getLocalDateString());

  const topEmotion = emotionMix[0];
  const topLabel = topEmotion ? emotionLabel(locale, topEmotion.id) : null;
  const workLead = workInsights[0];

  const avgEnergy =
    checkIns.length > 0
      ? checkIns.reduce((sum, d) => sum + (d.energyLevel ?? 0), 0) / checkIns.length
      : 0;

  const headline = workLead
    ? translate(locale, 'parami.behaviorHeadline', { period: periodName.toLowerCase() })
    : locale === 'en'
      ? `Your rhythm over ${periodName.toLowerCase()}`
      : `Tu ritmo en ${periodName.toLowerCase()}`;

  let summary: string;
  if (checkIns.length < 3) {
    summary = translate(locale, 'parami.behaviorNeedCheckIns');
  } else if (workLead) {
    summary = translate(locale, 'parami.behaviorSummary', { count: checkIns.length });
  } else if (topLabel) {
    summary = translate(locale, 'parami.behaviorFreeSummary', {
      count: checkIns.length,
      emotion: topLabel,
    });
  } else {
    summary = translate(locale, 'parami.behaviorFreeSummaryPlain', { count: checkIns.length });
  }

  const patternNote =
    workLead?.message ??
    feelInsights[0]?.message ??
    (avgEnergy >= 3.5
      ? locale === 'en'
        ? 'Your energy stayed mostly steady — room for small steps without pushing.'
        : 'Tu energía se mantuvo bastante estable — hay espacio para pasos pequeños sin forzar.'
      : locale === 'en'
        ? 'Some days asked for more rest — listening to that is part of the pattern too.'
        : 'Algunos días pidieron más descanso — escuchar eso también es parte del patrón.');

  const gentleTip =
    workLead?.tip ??
    feelInsights[1]?.message ??
    (!isPremium && checkIns.length >= 3
      ? translate(locale, 'parami.behaviorPremiumTease')
      : locale === 'en'
        ? 'One minute in Today tomorrow is enough. No streak pressure — just your pace.'
        : 'Un minuto en Hoy mañana basta. Sin presión de racha — solo tu ritmo.');

  const applyMode = applyModeForBehaviorType(workLead?.type);
  const correlationLabel = workLead
    ? translate(locale, 'parami.patternCorrelationWork')
    : translate(locale, 'parami.patternCorrelationFeel');

  return {
    headline,
    summary,
    patternNote,
    gentleTip,
    source: workLead ? 'work' : 'feel',
    correlationLabel,
    applyMode,
    patternType: workLead?.type,
  };
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
    completedCount: (input.tasks ?? []).filter((task) => task.is_completed && task.completed_at)
      .length,
    isPremium: Boolean(input.isPremium),
  };
}
