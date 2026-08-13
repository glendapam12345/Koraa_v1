import AsyncStorage from '@react-native-async-storage/async-storage';

const DONE_PREFIX = 'koraa_first_session_micro_step_done_v1_';

export function getFirstSessionMicroStepDoneKey(userId: string): string {
  return `${DONE_PREFIX}${userId}`;
}

export async function hasCompletedFirstSessionMicroStep(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(getFirstSessionMicroStepDoneKey(userId))) === '1';
  } catch {
    return false;
  }
}

export async function markFirstSessionMicroStepCompleted(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(getFirstSessionMicroStepDoneKey(userId), '1');
  } catch {
    /* no bloquear UI */
  }
}

/**
 * Día 1 (vista lite) + check-in + hay un paso sugerido + aún no cerró el ciclo.
 * Anti-presión: solo resalta un paso; no exige completar varios.
 */
export function shouldHighlightFirstSessionMicroStep(params: {
  isLiteDay: boolean;
  hasCheckIn: boolean;
  hasFocusTask: boolean;
  alreadyCompleted: boolean;
  crisisMode?: boolean;
}): boolean {
  const { isLiteDay, hasCheckIn, hasFocusTask, alreadyCompleted, crisisMode } = params;
  if (crisisMode) return false;
  if (!isLiteDay || !hasCheckIn || !hasFocusTask || alreadyCompleted) return false;
  return true;
}
