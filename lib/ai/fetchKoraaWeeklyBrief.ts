import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { KoraaWeekContext, KoraaWeeklyBrief } from '@/lib/ai/types';
import {
  koraaWeeklyBriefCacheKey,
  readKoraaWeeklyBriefCache,
  writeKoraaWeeklyBriefCache,
} from '@/lib/ai/koraaWeeklyBriefCache';
import {
  buildKoraaBrainWeeklyBriefBody,
  KORAA_BRAIN_FUNCTION,
  type KoraaBrainWeeklyBriefResponse,
} from '@/lib/ai/invokeKoraaBrain';

function isAiEnabled(): boolean {
  const flag = process.env.EXPO_PUBLIC_HOY_COACH_AI_ENABLED;
  return flag === 'true' || flag === '1';
}

export function buildLocalKoraaWeeklyBrief(context: KoraaWeekContext): KoraaWeeklyBrief {
  const { locale, totals, today, days } = context;
  const isEn = locale === 'en';
  const open = totals.openTasks;
  const busiest = totals.busiestDayName;
  const lowEnergyToday = today && today.energyLevel <= 2;
  const heavyDay = totals.busiestDayCount >= 4;

  let headline = isEn ? 'Your week at a glance' : 'Tu semana de un vistazo';
  let summary = isEn
    ? open > 0
      ? `You have ${open} open steps spread across the week.`
      : 'Your calendar looks light — room to breathe.'
    : open > 0
      ? `Tienes ${open} pasos abiertos repartidos en la semana.`
      : 'Tu calendario se ve liviano — hay espacio para respirar.';

  let gentleAdvice = isEn
    ? 'Move one step at a time; nothing has to happen today.'
    : 'Mueve un paso a la vez; no tiene que pasar todo hoy.';

  if (lowEnergyToday) {
    headline = isEn ? 'Protect your energy this week' : 'Protege tu energía esta semana';
    summary = isEn
      ? `You're at ${today!.energyLevel}/5 today — Koraa suggests fewer steps, not more.`
      : `Hoy estás en ${today!.energyLevel}/5 — Koraa sugiere menos pasos, no más.`;
    gentleAdvice = isEn
      ? 'Leave white space on heavy days; rest counts as progress.'
      : 'Deja espacio en blanco en días cargados; descansar también cuenta.';
  } else if (heavyDay && busiest) {
    headline = isEn ? 'One day looks fuller' : 'Un día se ve más lleno';
    summary = isEn
      ? `${busiest} has the most steps (${totals.busiestDayCount}). Spreading them can feel lighter.`
      : `${busiest} concentra más pasos (${totals.busiestDayCount}). Repartirlos puede sentirse más liviano.`;
    gentleAdvice = isEn
      ? 'Drag a card to a lighter day if it helps — no guilt.'
      : 'Arrastra una tarjeta a un día más liviano si te ayuda — sin culpa.';
  } else if (totals.completedTasks > 0) {
    summary = isEn
      ? `You already closed ${totals.completedTasks} step${totals.completedTasks === 1 ? '' : 's'} this week.`
      : `Ya cerraste ${totals.completedTasks} paso${totals.completedTasks === 1 ? '' : 's'} esta semana.`;
  }

  const checkInGap = days.filter((day) => day.isToday || day.date >= context.weekStart).length;
  if (totals.checkInDays === 0 && checkInGap > 0) {
    gentleAdvice = isEn
      ? 'A quick check-in on Today helps Koraa color and sort your week.'
      : 'Un check-in rápido en Hoy ayuda a Koraa a colorear y ordenar tu semana.';
  }

  return {
    headline,
    summary,
    gentleAdvice,
    fromAi: false,
  };
}

async function logInvokeFailure(error: unknown): Promise<void> {
  if (!__DEV__) return;

  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      logger.warn('[koraa-brain weekly] HTTP error:', body);
    } catch {
      logger.warn('[koraa-brain weekly] HTTP', error.context.status, error.message);
    }
    return;
  }

  if (error instanceof FunctionsRelayError) {
    logger.warn('[koraa-brain weekly] Relay:', error.message);
    return;
  }

  if (error instanceof FunctionsFetchError) {
    logger.warn('[koraa-brain weekly] Network:', error.message);
    return;
  }

  logger.warn('[koraa-brain weekly]', error);
}

function parseWeeklyBriefPayload(
  data: unknown,
  context: KoraaWeekContext,
): KoraaWeeklyBrief | null {
  if (!data) return null;

  let raw: unknown = data;
  if (typeof data === 'string') {
    try {
      raw = JSON.parse(data);
    } catch {
      return null;
    }
  }

  const payload = raw as KoraaBrainWeeklyBriefResponse;
  const local = buildLocalKoraaWeeklyBrief(context);
  const fromAi = payload.source === 'openai';

  const headline =
    typeof payload.headline === 'string' && payload.headline.trim()
      ? payload.headline.trim().slice(0, 200)
      : local.headline;
  const summary =
    typeof payload.summary === 'string' && payload.summary.trim()
      ? payload.summary.trim().slice(0, 400)
      : local.summary;
  const gentleAdvice =
    typeof payload.gentleAdvice === 'string' && payload.gentleAdvice.trim()
      ? payload.gentleAdvice.trim().slice(0, 280)
      : local.gentleAdvice;

  if (!headline || !summary) return null;

  return {
    headline,
    summary,
    gentleAdvice,
    fromAi,
  };
}

export async function fetchKoraaWeeklyBrief(
  userId: string | undefined,
  context: KoraaWeekContext,
): Promise<KoraaWeeklyBrief> {
  const local = buildLocalKoraaWeeklyBrief(context);

  if (!userId || !isSupabaseConfigured) {
    return local;
  }

  const cacheKey = koraaWeeklyBriefCacheKey(userId, context);
  const cached = await readKoraaWeeklyBriefCache(cacheKey);
  if (cached) return cached;

  if (!isAiEnabled()) {
    await writeKoraaWeeklyBriefCache(cacheKey, local);
    return local;
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.access_token) {
      await writeKoraaWeeklyBriefCache(cacheKey, local);
      return local;
    }

    const { data, error } = await supabase.functions.invoke(KORAA_BRAIN_FUNCTION, {
      body: buildKoraaBrainWeeklyBriefBody(context),
    });

    if (error) {
      await logInvokeFailure(error);
      await writeKoraaWeeklyBriefCache(cacheKey, local);
      return local;
    }

    const parsed = parseWeeklyBriefPayload(data, context);
    if (!parsed) {
      await writeKoraaWeeklyBriefCache(cacheKey, local);
      return local;
    }

    await writeKoraaWeeklyBriefCache(cacheKey, parsed);
    if (__DEV__ && parsed.fromAi) logger.debug('[koraa-brain weekly] OK (IA)');

    return parsed;
  } catch (err) {
    await logInvokeFailure(err);
    return local;
  }
}
