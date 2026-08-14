import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PatternHoyApplyMode } from '@/lib/behaviorInsights';
import { getLocalDateString } from '@/lib/dateLocal';

export type { PatternHoyApplyMode };

const PENDING_KEY = '@koraa/pattern_hoy_apply_v1';
const ACTIVE_KEY = '@koraa/pattern_hoy_active_v1';

export type PatternHoyApply = {
  tip: string;
  mode: PatternHoyApplyMode;
  patternType?: string;
  savedAt: string;
};

type ActivePatternHoyApply = PatternHoyApply & {
  localDate: string;
};

function parseApply(raw: string | null): PatternHoyApply | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PatternHoyApply;
    if (!parsed?.tip || typeof parsed.tip !== 'string') return null;
    const tip = parsed.tip.trim();
    if (!tip) return null;
    return {
      tip,
      mode: parsed.mode ?? 'open_hoy',
      patternType: parsed.patternType,
      savedAt: parsed.savedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function parseActive(raw: string | null): ActivePatternHoyApply | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ActivePatternHoyApply;
    if (!parsed?.tip || typeof parsed.tip !== 'string') return null;
    const tip = parsed.tip.trim();
    if (!tip || !parsed.localDate) return null;
    return {
      tip,
      mode: parsed.mode ?? 'open_hoy',
      patternType: parsed.patternType,
      savedAt: parsed.savedAt ?? new Date().toISOString(),
      localDate: parsed.localDate,
    };
  } catch {
    return null;
  }
}

/** Guarda un ajuste suave desde Para mí para la próxima visita a Hoy. */
export async function savePatternHoyApply(
  tip: string,
  mode: PatternHoyApplyMode,
  patternType?: string,
): Promise<void> {
  const payload: PatternHoyApply = {
    tip: tip.trim(),
    mode,
    patternType,
    savedAt: new Date().toISOString(),
  };
  if (!payload.tip) return;
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(payload));
}

async function writeActive(
  apply: PatternHoyApply,
  localDate: string,
): Promise<void> {
  const active: ActivePatternHoyApply = { ...apply, localDate };
  await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
}

/**
 * Promueve un pendiente a activo del día, o relee el activo vigente.
 * `justActivated` es true solo cuando acaba de llegar desde Para mí (toast una vez).
 */
export async function activatePatternHoyApply(
  today: string = getLocalDateString(),
): Promise<{ apply: PatternHoyApply; justActivated: boolean } | null> {
  try {
    const pendingRaw = await AsyncStorage.getItem(PENDING_KEY);
    const pending = parseApply(pendingRaw);
    if (pending) {
      await AsyncStorage.removeItem(PENDING_KEY);
      await writeActive(pending, today);
      return { apply: pending, justActivated: true };
    }

    const activeRaw = await AsyncStorage.getItem(ACTIVE_KEY);
    const active = parseActive(activeRaw);
    if (!active) return null;
    if (active.localDate !== today) {
      await AsyncStorage.removeItem(ACTIVE_KEY);
      return null;
    }
    return {
      apply: {
        tip: active.tip,
        mode: active.mode,
        patternType: active.patternType,
        savedAt: active.savedAt,
      },
      justActivated: false,
    };
  } catch {
    return null;
  }
}

/** Lee el ajuste activo de hoy sin promover pendientes. */
export async function getActivePatternHoyApply(
  today: string = getLocalDateString(),
): Promise<PatternHoyApply | null> {
  try {
    const active = parseActive(await AsyncStorage.getItem(ACTIVE_KEY));
    if (!active) return null;
    if (active.localDate !== today) {
      await AsyncStorage.removeItem(ACTIVE_KEY);
      return null;
    }
    return {
      tip: active.tip,
      mode: active.mode,
      patternType: active.patternType,
      savedAt: active.savedAt,
    };
  } catch {
    return null;
  }
}

/** Quita pendiente y activo — p. ej. un replan de check-in manda sobre Para mí. */
export async function clearActivePatternHoyApply(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([PENDING_KEY, ACTIVE_KEY]);
  } catch {
    /* no-op */
  }
}

/** @deprecated Prefer activatePatternHoyApply — mantiene compat con tests antiguos. */
export async function consumePatternHoyApply(): Promise<PatternHoyApply | null> {
  const result = await activatePatternHoyApply();
  if (!result?.justActivated) return null;
  return result.apply;
}
