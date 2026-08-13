import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PatternHoyApplyMode } from '@/lib/behaviorInsights';

export type { PatternHoyApplyMode };

const STORAGE_KEY = '@koraa/pattern_hoy_apply_v1';

export type PatternHoyApply = {
  tip: string;
  mode: PatternHoyApplyMode;
  patternType?: string;
  savedAt: string;
};

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
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

/** Lee y borra el ajuste (una sola vez al abrir Hoy). */
export async function consumePatternHoyApply(): Promise<PatternHoyApply | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as PatternHoyApply;
    if (!parsed?.tip || typeof parsed.tip !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}
