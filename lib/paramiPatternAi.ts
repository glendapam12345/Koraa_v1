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
import { buildParamiPatternInputKey, digestParamiPatternFingerprint } from '@/lib/paramiPatternInputKey';

/** v3: digest dual + índice por usuario (clear sin getAllKeys). */
const CACHE_PREFIX = 'koraa_parami_pattern_ai_v3';
const MAX_INDEXED_KEYS = 24;

/** Seq por usuario para descartar respuestas de fetches superados. */
const fetchSeqByUser = new Map<string, number>();

function isAiEnabled(): boolean {
  const flag = process.env.EXPO_PUBLIC_HOY_COACH_AI_ENABLED;
  return flag === 'true' || flag === '1';
}

function cacheKey(userId: string, input: ParamiPatternInput): string {
  const digest = digestParamiPatternFingerprint(buildParamiPatternInputKey(input));
  return `${CACHE_PREFIX}_${userId}_${digest}`;
}

function indexKey(userId: string): string {
  return `${CACHE_PREFIX}_index_${userId}`;
}

async function readCacheIndex(userId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(indexKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((k): k is string => typeof k === 'string');
  } catch {
    return [];
  }
}

async function rememberCacheKey(userId: string, key: string): Promise<void> {
  try {
    const current = await readCacheIndex(userId);
    if (current.includes(key)) return;
    const next = [...current, key].slice(-MAX_INDEXED_KEYS);
    await AsyncStorage.setItem(indexKey(userId), JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** Invalida el insight de Para mí tras check-in / cambios de ritmo. */
export async function clearParamiPatternAiCache(userId?: string): Promise<void> {
  try {
    if (userId) {
      const indexed = await readCacheIndex(userId);
      const toRemove = [...indexed, indexKey(userId)];
      if (toRemove.length > 0) {
        await AsyncStorage.multiRemove(toRemove);
      }
      return;
    }

    // Sin userId: solo limpia índices conocidos vía getAllKeys (raro; check-in siempre pasa userId).
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter((k) => k.startsWith(`${CACHE_PREFIX}_`));
    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
    }
  } catch {
    /* ignore */
  }
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

async function writeCache(
  userId: string,
  key: string,
  insight: ParamiPatternInsight,
): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(insight));
    await rememberCacheKey(userId, key);
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

function isFetchCurrent(userId: string, seq: number): boolean {
  return fetchSeqByUser.get(userId) === seq;
}

export async function fetchParamiPatternInsight(
  userId: string | undefined,
  input: ParamiPatternInput,
): Promise<ParamiPatternInsight & { fromAi: boolean }> {
  const local = { ...buildParamiPatternInsight(input), fromAi: false };

  if (!userId || !isAiEnabled() || !isSupabaseConfigured) {
    return local;
  }

  const seq = (fetchSeqByUser.get(userId) ?? 0) + 1;
  fetchSeqByUser.set(userId, seq);

  const key = cacheKey(userId, input);
  const cached = await readCache(key);
  if (!isFetchCurrent(userId, seq)) {
    return local;
  }
  if (cached) {
    return {
      ...cached,
      source: local.source,
      correlationLabel: local.correlationLabel,
      applyMode: local.applyMode,
      patternType: local.patternType,
      fromAi: true,
    };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!isFetchCurrent(userId, seq)) {
      return local;
    }
    if (!sessionData.session?.access_token) {
      return local;
    }

    const { data, error } = await supabase.functions.invoke('parami-patterns', {
      body: buildParamiPatternPayload(input),
    });

    if (!isFetchCurrent(userId, seq)) {
      return local;
    }

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
    const merged = {
      ...insight,
      source: local.source,
      correlationLabel: local.correlationLabel,
      applyMode: local.applyMode,
      patternType: local.patternType,
      fromAi,
    };
    if (fromAi && isFetchCurrent(userId, seq)) {
      await writeCache(userId, key, insight);
    }
    return merged;
  } catch (err) {
    await logInvokeFailure(err);
    return local;
  }
}
