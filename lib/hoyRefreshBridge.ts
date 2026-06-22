type HoyRefreshListener = () => void;

const listeners = new Set<HoyRefreshListener>();

/** Suscripción para recargar Hoy tras replan u otros cambios remotos. */
export function subscribeHoyRefresh(listener: HoyRefreshListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function requestHoyRefresh(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      if (__DEV__) {
        console.warn('[hoyRefreshBridge]', error);
      }
    }
  }
}
