type Listener = () => void;

const listeners = new Set<Listener>();
const closedListeners = new Set<Listener>();

function notify(set: Set<Listener>): void {
  set.forEach((listener) => {
    try {
      listener();
    } catch {
      /* no-op */
    }
  });
}

/** Tras recheck o check-in guardado: pantallas recargan mood/tareas. */
export function subscribeCheckInRefresh(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishCheckInRefresh(): void {
  notify(listeners);
}

/** Recheck cerrado sin guardar — el flujo de Hoy puede volver a preguntar. */
export function subscribeCheckInClosed(listener: Listener): () => void {
  closedListeners.add(listener);
  return () => closedListeners.delete(listener);
}

export function publishCheckInClosed(): void {
  notify(closedListeners);
}
