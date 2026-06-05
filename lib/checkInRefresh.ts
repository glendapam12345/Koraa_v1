type Listener = () => void;

const listeners = new Set<Listener>();

/** Tras recheck o check-in guardado: pantallas recargan mood/tareas. */
export function subscribeCheckInRefresh(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishCheckInRefresh(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* no-op */
    }
  });
}
