import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { buildHoyCoachMessage } from '@/lib/hoyDailyCoach';
import { getCategoryLead, getPersonalizedTips } from '@/lib/tipsPersonalization';
import { logger } from '@/lib/logger';
import type { KoraaDailyBrief, KoraaDayContext, TaskCandidate, TipCandidate } from '@/lib/ai/types';
import {
  koraaDailyBriefCacheKey,
  readKoraaDailyBriefCache,
  writeKoraaDailyBriefCache,
} from '@/lib/ai/koraaDailyBriefCache';
import { shortlistTipsForAi } from '@/lib/ai/shortlistTipsForAi';
import { resolveAiFocusTaskIds } from '@/lib/ai/applyAiFocusPlan';
import type { CheckInData } from '@/lib/smartPrioritization';
import {
  buildKoraaBrainDailyBriefBody,
  KORAA_BRAIN_FUNCTION,
  type KoraaBrainDailyBriefResponse,
} from '@/lib/ai/invokeKoraaBrain';
import type { TipCategoryId } from '@/lib/tipsTypes';

export type FetchKoraaDailyBriefOptions = {
  taskCandidates?: TaskCandidate[];
  skipCache?: boolean;
};

import { isKoraaBrainAiEnabled } from '@/lib/ai/isKoraaBrainEnabled';

function tipsContextFromDay(context: KoraaDayContext) {
  return {
    emotion: context.checkIn.emotionKey,
    energyLevel: context.checkIn.energyLevel,
    availableTime: context.checkIn.availableTime,
    focusLevel: context.checkIn.focusLevel,
  };
}

function checkInFromContext(context: KoraaDayContext): CheckInData {
  return {
    emotion: context.checkIn.emotionKey,
    energyLevel: context.checkIn.energyLevel,
    availableTime: context.checkIn.availableTime,
    focusLevel: context.checkIn.focusLevel,
  };
}

function shouldCacheBrief(context: KoraaDayContext): boolean {
  return Boolean(context.checkIn.emotionKey && context.checkIn.energyLevel > 0);
}

function buildLocalBrief(
  context: KoraaDayContext,
  tipCandidates: TipCandidate[],
  taskCandidates: TaskCandidate[] = [],
): KoraaDailyBrief {
  const coach = buildHoyCoachMessage({
    locale: context.locale,
    displayName: context.displayName,
    emotionKey: context.checkIn.emotionKey,
    emotionLabel: context.checkIn.emotionLabel,
    energyLevel: context.checkIn.energyLevel,
    suggestion: context.plan.suggestion,
    focusCount: context.plan.focusCount,
  });

  const candidateIds = new Set(tipCandidates.map((tip) => tip.id));
  const tipIds = getPersonalizedTips(tipsContextFromDay(context), context.locale)
    .map((tip) => tip.id)
    .filter((id) => candidateIds.has(id))
    .slice(0, 3);

  const primaryCategory = (tipCandidates.find((tip) => tip.id === tipIds[0])?.category ??
    'mindset') as TipCategoryId;

  const checkIn = checkInFromContext(context);
  const focusTaskIds = resolveAiFocusTaskIds(
    taskCandidates.map((task) => task.id),
    taskCandidates,
    checkIn,
  );

  const planHeadline =
    context.plan.suggestion.trim() ||
    coach.actionLine ||
    (context.locale === 'en' ? 'A few gentle steps for today.' : 'Unos pasos suaves para hoy.');

  return {
    coach,
    tipIds,
    tipLead: getCategoryLead(primaryCategory, tipsContextFromDay(context), context.locale),
    focusTaskIds,
    planHeadline,
    fromAi: false,
    focusFromAi: false,
  };
}

async function logInvokeFailure(error: unknown): Promise<void> {
  if (!__DEV__) return;

  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      logger.warn('[koraa-brain] HTTP error:', body);
    } catch {
      logger.warn('[koraa-brain] HTTP', error.context.status, error.message);
    }
    return;
  }

  if (error instanceof FunctionsRelayError) {
    logger.warn('[koraa-brain] Relay:', error.message);
    return;
  }

  if (error instanceof FunctionsFetchError) {
    logger.warn('[koraa-brain] Network:', error.message);
    return;
  }

  logger.warn('[koraa-brain]', error);
}

type DailyBriefApiResponse = KoraaBrainDailyBriefResponse;

function parseDailyBriefPayload(
  data: unknown,
  context: KoraaDayContext,
  tipCandidates: TipCandidate[],
  taskCandidates: TaskCandidate[],
): KoraaDailyBrief | null {
  if (!data) return null;

  let raw: unknown = data;
  if (typeof data === 'string') {
    try {
      raw = JSON.parse(data);
    } catch {
      return null;
    }
  }

  const payload = raw as DailyBriefApiResponse;
  const coach = payload.coach;
  if (
    !coach ||
    typeof coach.greeting !== 'string' ||
    typeof coach.body !== 'string' ||
    typeof coach.actionLine !== 'string'
  ) {
    return null;
  }

  const localFallback = buildLocalBrief(context, tipCandidates, taskCandidates);
  const checkIn = checkInFromContext(context);
  const fromAi = payload.source === 'openai';

  const validTipIds = new Set(tipCandidates.map((tip) => tip.id));
  const tipIds = (payload.tipIds ?? [])
    .filter((id): id is string => typeof id === 'string' && validTipIds.has(id))
    .slice(0, 3);
  const resolvedTipIds = tipIds.length > 0 ? tipIds : localFallback.tipIds;

  const primaryCategory = (tipCandidates.find((tip) => tip.id === resolvedTipIds[0])?.category ??
    'mindset') as TipCategoryId;

  const tipLead =
    typeof payload.tipLead === 'string' && payload.tipLead.trim()
      ? payload.tipLead.trim()
      : getCategoryLead(primaryCategory, tipsContextFromDay(context), context.locale);

  const aiFocusIds = resolveAiFocusTaskIds(payload.focusTaskIds, taskCandidates, checkIn);
  const focusTaskIds = aiFocusIds.length > 0 ? aiFocusIds : localFallback.focusTaskIds;

  const planHeadline =
    typeof payload.planHeadline === 'string' && payload.planHeadline.trim()
      ? payload.planHeadline.trim()
      : localFallback.planHeadline;

  return {
    coach: {
      greeting: coach.greeting.trim(),
      body: coach.body.trim(),
      actionLine: coach.actionLine.trim(),
    },
    tipIds: resolvedTipIds,
    tipLead,
    focusTaskIds,
    planHeadline,
    fromAi,
    focusFromAi: fromAi && aiFocusIds.length > 0,
  };
}

/** Brief local (sin red) para tips o fallback. */
export function buildLocalKoraaDailyBrief(
  context: KoraaDayContext,
  taskCandidates: TaskCandidate[] = [],
): KoraaDailyBrief {
  const tipCandidates = shortlistTipsForAi(tipsContextFromDay(context), context.locale);
  return buildLocalBrief(context, tipCandidates, taskCandidates);
}

async function maybeCacheBrief(
  userId: string | undefined,
  context: KoraaDayContext,
  brief: KoraaDailyBrief,
  taskCandidateIds: string[] = [],
): Promise<void> {
  if (!userId || !shouldCacheBrief(context)) return;
  await writeKoraaDailyBriefCache(
    koraaDailyBriefCacheKey(userId, context, taskCandidateIds),
    brief,
  );
}

/** Tips: solo cache o reglas locales — evita llamadas IA con contexto vacío. */
export async function resolveKoraaTipsBrief(
  userId: string | undefined,
  context: KoraaDayContext,
): Promise<KoraaDailyBrief> {
  const cached = userId ? await getCachedKoraaDailyBrief(userId, context) : null;
  if (cached) return cached;
  return buildLocalKoraaDailyBrief(context);
}

export async function fetchKoraaDailyBrief(
  userId: string | undefined,
  context: KoraaDayContext,
  options?: FetchKoraaDailyBriefOptions,
): Promise<KoraaDailyBrief> {
  const tipCandidates = shortlistTipsForAi(tipsContextFromDay(context), context.locale);
  const taskCandidates = options?.taskCandidates ?? [];
  const taskCandidateIds = taskCandidates.map((task) => task.id);
  const local = buildLocalBrief(context, tipCandidates, taskCandidates);

  if (!userId || !isSupabaseConfigured) {
    return local;
  }

  const cacheKey = koraaDailyBriefCacheKey(userId, context, taskCandidateIds);
  if (!options?.skipCache) {
    const cached = await readKoraaDailyBriefCache(cacheKey);
    if (cached) return cached;
  }

  if (!isKoraaBrainAiEnabled()) {
    await maybeCacheBrief(userId, context, local, taskCandidateIds);
    return local;
  }

  const weekday = new Date().toLocaleDateString(
    context.locale === 'en' ? 'en-US' : 'es-ES',
    { weekday: 'long' },
  );

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.access_token) {
      await maybeCacheBrief(userId, context, local, taskCandidateIds);
      return local;
    }

    const { data, error } = await supabase.functions.invoke(KORAA_BRAIN_FUNCTION, {
      body: buildKoraaBrainDailyBriefBody(context, tipCandidates, taskCandidates, weekday),
    });

    if (error) {
      await logInvokeFailure(error);
      if (__DEV__) {
        logger.debug('[koraa-brain] fallback local (invoke error)');
      }
      await maybeCacheBrief(userId, context, local, taskCandidateIds);
      return local;
    }

    const parsed = parseDailyBriefPayload(data, context, tipCandidates, taskCandidates);
    if (!parsed) {
      if (__DEV__) {
        logger.debug('[koraa-brain] fallback local (invalid payload)');
      }
      await maybeCacheBrief(userId, context, local, taskCandidateIds);
      return local;
    }

    await maybeCacheBrief(userId, context, parsed, taskCandidateIds);
    if (__DEV__ && parsed.fromAi) logger.debug('[koraa-brain] OK (IA)');

    return parsed;
  } catch (err) {
    await logInvokeFailure(err);
    return local;
  }
}

/** Lee el brief cacheado del día (sin red). */
export async function getCachedKoraaDailyBrief(
  userId: string | undefined,
  context: KoraaDayContext,
  taskCandidateIds: string[] = [],
): Promise<KoraaDailyBrief | null> {
  if (!userId) return null;
  return readKoraaDailyBriefCache(koraaDailyBriefCacheKey(userId, context, taskCandidateIds));
}
