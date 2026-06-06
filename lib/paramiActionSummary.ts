import type { DayData } from '@/components/ProgressChart';
import type { EmotionalInsight } from '@/lib/emotionalInsights';

export type ParamiActiveHeadlineKey =
  | 'parami.activeHeadlineProtect'
  | 'parami.activeHeadlineGood'
  | 'parami.activeHeadlineBalanced'
  | 'parami.activeHeadlineLearning'
  | 'parami.activeHeadlineNoData';

export type ParamiHeaderCtaKey = 'parami.headerCtaHoy' | 'parami.headerCtaCheckIn';

export function getParamiActiveSummary(
  periodData: DayData[],
  todayEnergyLevel: number,
): {
  headlineKey: ParamiActiveHeadlineKey;
  avgEnergy: number;
  checkInCount: number;
  ctaKey: ParamiHeaderCtaKey;
} {
  const withCheckIn = periodData.filter((d) => d.hasCheckIn && d.energyLevel);
  const checkInCount = withCheckIn.length;

  if (checkInCount === 0 && todayEnergyLevel <= 0) {
    return {
      headlineKey: 'parami.activeHeadlineNoData',
      avgEnergy: 0,
      checkInCount: 0,
      ctaKey: 'parami.headerCtaCheckIn',
    };
  }

  const avgEnergy =
    checkInCount > 0
      ? Math.round(
          withCheckIn.reduce((sum, d) => sum + (d.energyLevel ?? 3), 0) / checkInCount,
        )
      : todayEnergyLevel;

  let headlineKey: ParamiActiveHeadlineKey = 'parami.activeHeadlineBalanced';
  if (checkInCount < 2) {
    headlineKey = 'parami.activeHeadlineLearning';
  } else if (avgEnergy <= 2) {
    headlineKey = 'parami.activeHeadlineProtect';
  } else if (avgEnergy >= 4) {
    headlineKey = 'parami.activeHeadlineGood';
  }

  return {
    headlineKey,
    avgEnergy,
    checkInCount,
    ctaKey: 'parami.headerCtaHoy',
  };
}

export type InsightActionRoute = '/(tabs)' | '/(tabs)/tips';

export function getInsightAction(insight: EmotionalInsight): {
  route: InsightActionRoute;
  labelKey: 'parami.insightActionHoy' | 'parami.insightActionTips';
} {
  if (insight.type === 'pattern') {
    return { route: '/(tabs)/tips', labelKey: 'parami.insightActionTips' };
  }
  return { route: '/(tabs)', labelKey: 'parami.insightActionHoy' };
}
