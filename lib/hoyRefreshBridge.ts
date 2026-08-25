type HoyRefreshPayload = {
  /** Pasos recién capturados: Hoy los pone al frente del plan. */
  pinTaskIds?: string[];
};

type HoyRefreshListener = (payload?: HoyRefreshPayload) => void;

const listeners = new Set<HoyRefreshListener>();
let pinnedTaskIds: string[] = [];

function mergePinnedTaskIds(next: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const id of [...next, ...pinnedTaskIds]) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    merged.push(trimmed);
  }
  return merged;
}

/** IDs de captura reciente, aunque Hoy aún no estuviera montado. */
export function peekHoyPinnedTaskIds(): string[] {
  return [...pinnedTaskIds];
}

/** @internal tests */
export function resetHoyPinnedTaskIds(): void {
  pinnedTaskIds = [];
}

/** Suscripción para recargar Hoy tras replan u otros cambios remotos. */
export function subscribeHoyRefresh(listener: HoyRefreshListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function requestHoyRefresh(payload?: HoyRefreshPayload): void {
  if (payload?.pinTaskIds && payload.pinTaskIds.length > 0) {
    pinnedTaskIds = mergePinnedTaskIds(payload.pinTaskIds);
  }
  const snapshot = payload
    ? { ...payload, pinTaskIds: peekHoyPinnedTaskIds() }
    : pinnedTaskIds.length > 0
      ? { pinTaskIds: peekHoyPinnedTaskIds() }
      : undefined;
  for (const listener of listeners) {
    try {
      listener(snapshot);
    } catch (error) {
      if (__DEV__) {
        console.warn('[hoyRefreshBridge]', error);
      }
    }
  }
}
