export type CheckInCelebrationPayload = {
  streak: number;
  milestone: boolean;
};

type Listener = (payload: CheckInCelebrationPayload) => void;

const listeners = new Set<Listener>();

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
