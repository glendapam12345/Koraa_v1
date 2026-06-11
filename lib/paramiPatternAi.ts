import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import {
  buildParamiPatternInsight,
  buildParamiPatternPayload,
  type ParamiPatternInput,
  type ParamiPatternInsight,
} from '@/lib/paramiPatternInsight';

const CACHE_PREFIX = 'koraa_parami_pattern_ai_v1';

function isAiEnabled(): boolean {
  const flag = process.env.EXPO_PUBLIC_HOY_COACH_AI_ENABLED;
  return flag === 'true' || flag === '1';
}

function cacheKey(userId: string, input: ParamiPatternInput): string {
  const lastDay = input.days[input.days.length - 1]?.date ?? 'unknown';
  return `${CACHE_PREFIX}_${userId}_${input.period}_${lastDay}_${input.locale}`;
}

async function readCache(key: string): Promise<ParamiPatternInsight | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ParamiPatternInsight;
    if (parsed?.headline && parsed?.summary && parsed?.patternNote && parsed?.gentleTip) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function writeCache(key: string, insight: ParamiPatternInsight): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(insight));
  } catch {
    /* ignore */
  }
}

function parseInsightPayload(data: unknown): ParamiPatternInsight | null {
  if (!data) return null;

  let raw: unknown = data;
  if (typeof data === 'string') {
    try {
      raw = JSON.parse(data);
    } catch {
      return null;
    }
  }

  const insight =
    (raw as { insight?: ParamiPatternInsight })?.insight ?? (raw as ParamiPatternInsight);
  if (
    insight &&
    typeof insight.headline === 'string' &&
    typeof insight.summary === 'string' &&
    typeof insight.patternNote === 'string' &&
    typeof insight.gentleTip === 'string'
  ) {
    return {
      headline: insight.headline.trim(),
      summary: insight.summary.trim(),
      patternNote: insight.patternNote.trim(),
      gentleTip: insight.gentleTip.trim(),
    };
  }
  return null;
}

async function logInvokeFailure(error: unknown): Promise<void> {
  if (!__DEV__) return;

  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      logger.warn('[parami-patterns] HTTP error:', body);
    } catch {
      logger.warn('[parami-patterns] HTTP', error.context.status, error.message);
    }
    return;
  }

  if (error instanceof FunctionsRelayError) {
    logger.warn('[parami-patterns] Relay:', error.message);
    return;
  }

  if (error instanceof FunctionsFetchError) {
    logger.warn('[parami-patterns] Red no alcanza Supabase:', error.message);
    return;
  }

  logger.warn('[parami-patterns]', error);
}

export async function fetchParamiPatternInsight(
  userId: string | undefined,
  input: ParamiPatternInput,
): Promise<ParamiPatternInsight & { fromAi: boolean }> {
  const local = { ...buildParamiPatternInsight(input), fromAi: false };

  if (!userId || !isAiEnabled() || !isSupabaseConfigured) {
    return local;
  }

  const key = cacheKey(userId, input);
  const cached = await readCache(key);
  if (cached) {
    return { ...cached, fromAi: true };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.access_token) {
      return local;
    }

    const { data, error } = await supabase.functions.invoke('parami-patterns', {
      body: buildParamiPatternPayload(input),
    });

    if (error) {
      await logInvokeFailure(error);
      return local;
    }

    const insight = parseInsightPayload(data);
    if (!insight) {
      return local;
    }

    const source = (data as { source?: string })?.source;
    const fromAi = source === 'openai';
    if (fromAi) {
      await writeCache(key, insight);
    }
    return { ...insight, fromAi };
  } catch (err) {
    await logInvokeFailure(err);
    return local;
  }
}
