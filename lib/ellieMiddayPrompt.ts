import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalDateString } from '@/lib/dateLocal';

const KEY_PREFIX = 'koraa_ellie_day_started_v1_';
const DONE_PREFIX = 'koraa_ellie_midday_done_v1_';
const PRIOR_VISIT_SESSION_ID = 'prior-visit';

/** Identifica esta ejecución de JS. Un cold start (o reload) es otra visita. */
export const ELLIE_JS_SESSION_STARTED_AT = Date.now();
export const ELLIE_JS_SESSION_ID = `${ELLIE_JS_SESSION_STARTED_AT}-${Math.random().toString(36).slice(2, 8)}`;

/** After this long in background, reopening is a later visit — not a tab flicker. */
export const ELLIE_AWAY_REASK_MS = 10 * 60 * 1000;

let promptSettledSessionId: string | null = null;

export function markElliePromptSettledThisSession(): void {
  promptSettledSessionId = ELLIE_JS_SESSION_ID;
}

export function isElliePromptSettledThisSession(): boolean {
  return promptSettledSessionId === ELLIE_JS_SESSION_ID;
}

export function clearElliePromptSettledThisSession(): void {
  promptSettledSessionId = null;
}

export function shouldReaskAfterAway(awayMs: number, thresholdMs = ELLIE_AWAY_REASK_MS): boolean {
  return awayMs >= thresholdMs;
}

export function getEllieDayStartedKey(userId: string, day: string = getLocalDateString()): string {
  return `${KEY_PREFIX}${userId}_${day}`;
}

export function getEllieMiddayDoneKey(userId: string, day: string = getLocalDateString()): string {
  return `${DONE_PREFIX}${userId}_${day}`;
}

const CLOSED_PREFIX = 'koraa_ellie_day_closed_v1_';

export function getEllieDayClosedKey(userId: string, day: string = getLocalDateString()): string {
  return `${CLOSED_PREFIX}${userId}_${day}`;
}

/**
 * Reentrada = ya hubo check-in y esta visita no es la que empezó el día.
 * No usa la hora del reloj: volver a las 14:00 no reinicia Captura ni cierra el día.
 */
export function shouldShowEllieMiddayPrompt(params: {
  hasCheckIn: boolean;
  isReturningLater: boolean;
  dismissed: boolean;
  crisisMode?: boolean;
}): boolean {
  const { hasCheckIn, isReturningLater, dismissed, crisisMode } = params;
  if (crisisMode) return false;
  if (!hasCheckIn || dismissed) return false;
  return isReturningLater;
}

/**
 * Reentrada = el día ya empezó y esta visita de Hoy no es el check-in que acaba de pasar.
 * Abrir la app con check-in de hoy cuenta como volver, aunque el JS session sea el mismo.
 */
export function isEllieReturningLater(params: {
  hasCheckIn: boolean;
  storedSessionId: string | null;
  currentSessionId: string;
  returnedFromBackground: boolean;
  /** Check-in already existed when this Hoy visit started (open app, login). */
  checkInPresentAtVisitStart?: boolean;
}): boolean {
  if (!params.hasCheckIn) return false;
  if (params.returnedFromBackground) return true;
  if (params.checkInPresentAtVisitStart) return true;
  if (params.storedSessionId == null) return false;
  return params.storedSessionId !== params.currentSessionId;
}

/**
 * Login / reopen with today's check-in → prior visit.
 * Check-in that just happened in this Hoy visit → this JS session.
 */
export function sessionIdForVisitStart(params: {
  checkInHappenedThisVisit: boolean;
  currentSessionId: string;
}): string {
  return params.checkInHappenedThisVisit ? params.currentSessionId : PRIOR_VISIT_SESSION_ID;
}

/**
 * Check-in de antes de abrir la app → otra visita (reentrada).
 * Check-in de esta sesión (onboarding / primer Sentir) → primera sesión.
 */
export function sessionIdForCheckInTime(params: {
  checkInCreatedAtMs: number | null;
  currentSessionId: string;
  sessionStartedAtMs: number;
}): string {
  const created = params.checkInCreatedAtMs;
  if (created == null || !Number.isFinite(created)) {
    return PRIOR_VISIT_SESSION_ID;
  }
  if (created < params.sessionStartedAtMs - 2000) {
    return PRIOR_VISIT_SESSION_ID;
  }
  return params.currentSessionId;
}

export async function readEllieDayStartedSession(
  userId: string,
  day: string = getLocalDateString(),
): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(getEllieDayStartedKey(userId, day));
  } catch {
    return null;
  }
}

export async function markEllieDayStartedSession(
  userId: string,
  sessionId: string,
  day: string = getLocalDateString(),
): Promise<void> {
  try {
    await AsyncStorage.setItem(getEllieDayStartedKey(userId, day), sessionId);
  } catch {
    /* no bloquear UI */
  }
}

export async function hasEllieMiddayDoneToday(
  userId: string,
  day: string = getLocalDateString(),
): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(getEllieMiddayDoneKey(userId, day))) === '1';
  } catch {
    return false;
  }
}

export async function markEllieMiddayDoneToday(
  userId: string,
  day: string = getLocalDateString(),
): Promise<void> {
  try {
    await AsyncStorage.setItem(getEllieMiddayDoneKey(userId, day), '1');
  } catch {
    /* no bloquear UI */
  }
}

export async function readEllieDayClosedToday(
  userId: string,
  day: string = getLocalDateString(),
): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(getEllieDayClosedKey(userId, day))) === '1';
  } catch {
    return false;
  }
}

export async function markEllieDayClosedToday(
  userId: string,
  day: string = getLocalDateString(),
): Promise<void> {
  try {
    await AsyncStorage.setItem(getEllieDayClosedKey(userId, day), '1');
  } catch {
    /* no bloquear UI */
  }
}

/** Al cerrar sesión: la próxima entrada no hereda “ya contesté” ni Captura forzada. */
export async function clearEllieMiddayState(
  userId: string,
  day: string = getLocalDateString(),
): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      getEllieDayStartedKey(userId, day),
      getEllieMiddayDoneKey(userId, day),
      getEllieDayClosedKey(userId, day),
    ]);
  } catch {
    /* no bloquear UI */
  }
}
