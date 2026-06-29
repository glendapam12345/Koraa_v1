import AsyncStorage from '@react-native-async-storage/async-storage';

export type CheckInCelebrationPayload = {
  streak: number;
  milestone: boolean;
};

type Listener = (payload: CheckInCelebrationPayload) => void;

const listeners = new Set<Listener>();
const QUEUE_KEY = 'koraa_check_in_celebration_queue_v1';

export function subscribeCheckInCelebration(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Tras guardar Sentir (check-in del día). Varios suscriptores: logo, confetti, refresh. */
export function publishCheckInCelebration(payload: CheckInCelebrationPayload): void {
  listeners.forEach((l) => {
    try {
      l(payload);
    } catch {
      /* no-op */
    }
  });
}

/** Onboarding → paywall: Hoy consume y publica al montar. */
export async function queueCheckInCelebration(payload: CheckInCelebrationPayload): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(payload));
  } catch {
    /* no crítico */
  }
}

export async function consumeQueuedCheckInCelebration(): Promise<CheckInCelebrationPayload | null> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(QUEUE_KEY);
    const parsed = JSON.parse(raw) as CheckInCelebrationPayload;
    if (typeof parsed?.streak !== 'number') return null;
    return {
      streak: parsed.streak,
      milestone: Boolean(parsed.milestone),
    };
  } catch {
    return null;
  }
}
