import type { KoraaDayContext, KoraaWeekContext, TaskCandidate, TipCandidate } from '@/lib/ai/types';

export const KORAA_BRAIN_FUNCTION = 'koraa-brain' as const;

export type KoraaBrainMode = 'daily_brief' | 'weekly_brief';

export type KoraaBrainDailyBriefRequest = {
  mode: 'daily_brief';
  context: KoraaDayContext;
  tipCandidates: TipCandidate[];
  taskCandidates: TaskCandidate[];
  weekday: string;
};

export type KoraaBrainDailyBriefResponse = {
  mode: 'daily_brief';
  coach: { greeting: string; body: string; actionLine: string };
  tipIds: string[];
  tipLead: string;
  focusTaskIds?: string[];
  planHeadline?: string;
  source: 'openai' | 'fallback';
  code?: string;
};

export function buildKoraaBrainDailyBriefBody(
  context: KoraaDayContext,
  tipCandidates: TipCandidate[],
  taskCandidates: TaskCandidate[],
  weekday: string,
): KoraaBrainDailyBriefRequest {
  return {
    mode: 'daily_brief',
    context,
    tipCandidates,
    taskCandidates,
    weekday,
  };
}

export type KoraaBrainWeeklyBriefRequest = {
  mode: 'weekly_brief';
  locale: 'es' | 'en';
  weekContext: KoraaWeekContext;
};

export type KoraaBrainWeeklyBriefResponse = {
  mode: 'weekly_brief';
  headline: string;
  summary: string;
  gentleAdvice: string;
  source: 'openai' | 'fallback';
  code?: string;
};

export function buildKoraaBrainWeeklyBriefBody(
  weekContext: KoraaWeekContext,
): KoraaBrainWeeklyBriefRequest {
  return {
    mode: 'weekly_brief',
    locale: weekContext.locale === 'en' ? 'en' : 'es',
    weekContext,
  };
}
