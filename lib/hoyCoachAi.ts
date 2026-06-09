import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  buildHoyCoachMessage,
  type HoyCoachInput,
  type HoyCoachMessage,
} from '@/lib/hoyDailyCoach';
import { getLocalDateString } from '@/lib/dateLocal';
import { logger } from '@/lib/logger';

export type { HoyCoachMessage };

const CACHE_PREFIX = 'koraa_hoy_coach_ai_v1';

function isAiEnabled(): boolean {
  const flag = process.env.EXPO_PUBLIC_HOY_COACH_AI_ENABLED;
  return flag === 'true' || flag === '1';
}

function cacheKey(userId: string, input: HoyCoachInput): string {
  const day = getLocalDateString();
  return `${CACHE_PREFIX}_${userId}_${day}_${input.emotionKey}_${input.energyLevel}_${input.locale}`;
}

async function readCache(key: string): Promise<HoyCoachMessage | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HoyCoachMessage;
    if (parsed?.greeting && parsed?.body && parsed?.actionLine) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

async function writeCache(key: string, message: HoyCoachMessage): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(message));
  } catch {
    /* ignore */
  }
}

async function logInvokeFailure(error: unknown): Promise<void> {
  if (!__DEV__) return;

  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      logger.warn('[hoy-coach] HTTP error:', body);
      if ((body as { code?: string })?.code === 'AI_DISABLED') {
        logger.warn('[hoy-coach] Falta OPENAI_API_KEY en Supabase → Edge Functions → Secrets');
      }
      if ((body as { code?: string })?.code === 'AI_FAILED') {
        logger.warn('[hoy-coach] OpenAI falló. Revisa billing en platform.openai.com');
      }
    } catch {
      logger.warn('[hoy-coach] HTTP', error.context.status, error.message);
    }
    return;
  }

  if (error instanceof FunctionsRelayError) {
    logger.warn('[hoy-coach] Relay:', error.message);
    return;
  }

  if (error instanceof FunctionsFetchError) {
    logger.warn('[hoy-coach] Red no alcanza Supabase:', error.message);
    return;
  }

  logger.warn('[hoy-coach]', error);
}

function parseCoachPayload(data: unknown): HoyCoachMessage | null {
  if (!data) return null;

  let raw: unknown = data;
  if (typeof data === 'string') {
    try {
      raw = JSON.parse(data);
    } catch {
      return null;
    }
  }

  const coach = (raw as { coach?: HoyCoachMessage })?.coach ?? (raw as HoyCoachMessage);
  if (
    coach &&
    typeof coach.greeting === 'string' &&
    typeof coach.body === 'string' &&
    typeof coach.actionLine === 'string'
  ) {
    return {
      greeting: coach.greeting.trim(),
      body: coach.body.trim(),
      actionLine: coach.actionLine.trim(),
    };
  }
  return null;
}

/**
 * Mensaje coach: IA vía Edge Function `hoy-coach` si está habilitada; si no, reglas locales.
 */
export async function fetchHoyCoachMessage(
  userId: string | undefined,
  input: HoyCoachInput,
): Promise<HoyCoachMessage & { fromAi: boolean }> {
  const fallback = buildHoyCoachMessage(input);
  const local = { ...fallback, fromAi: false };

  if (!userId) {
    if (__DEV__) logger.warn('[hoy-coach] Sin sesión: inicia sesión en la app');
    return local;
  }

  if (!isAiEnabled()) {
    if (__DEV__) logger.warn('[hoy-coach] IA desactivada. Pon EXPO_PUBLIC_HOY_COACH_AI_ENABLED=true en .env');
    return local;
  }

  if (!isSupabaseConfigured) {
    return local;
  }

  const key = cacheKey(userId, input);
  const cached = await readCache(key);
  if (cached) {
    return { ...cached, fromAi: true };
  }

  const weekday = new Date().toLocaleDateString(
    input.locale === 'en' ? 'en-US' : 'es-ES',
    { weekday: 'long' },
  );

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.access_token) {
      if (__DEV__) logger.warn('[hoy-coach] Sin token de sesión. Cierra sesión y vuelve a entrar.');
      return local;
    }

    const { data, error } = await supabase.functions.invoke('hoy-coach', {
      body: {
        locale: input.locale,
        displayName: input.displayName.split(/\s+/)[0] ?? input.displayName,
        emotionKey: input.emotionKey,
        emotionLabel: input.emotionLabel,
        energyLevel: input.energyLevel,
        suggestion: input.suggestion,
        focusCount: input.focusCount,
        weekday,
      },
    });

    if (error) {
      await logInvokeFailure(error);
      return local;
    }

    const coach = parseCoachPayload(data);
    if (!coach) {
      if (__DEV__) logger.warn('[hoy-coach] Respuesta vacía o inválida:', data);
      return local;
    }

    const source = (data as { source?: string })?.source;
    const fromAi = source === 'openai';
    if (__DEV__ && source === 'fallback') {
      const code = (data as { code?: string })?.code;
      const status = (data as { openaiStatus?: number })?.openaiStatus;
      logger.warn(
        '[hoy-coach] Fallback servidor',
        code ?? 'unknown',
        status ? `(OpenAI HTTP ${status})` : '',
      );
    }

    if (fromAi) {
      await writeCache(key, coach);
      if (__DEV__) logger.debug('[hoy-coach] OK (IA)');
    }
    return { ...coach, fromAi };
  } catch (err) {
    await logInvokeFailure(err);
    return local;
  }
}

/** Borra cache del coach (útil tras cambiar emoción o desplegar la función). */
export async function clearHoyCoachCache(userId: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter((k) => k.startsWith(`${CACHE_PREFIX}_${userId}_`));
    if (mine.length > 0) await AsyncStorage.multiRemove(mine);
  } catch {
    /* ignore */
  }
}
