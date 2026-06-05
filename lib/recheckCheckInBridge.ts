import { router } from 'expo-router';

export type OpenRecheckFn = (source?: string) => void | Promise<void>;

let openRecheckHandler: OpenRecheckFn | null = null;

export function registerOpenRecheck(handler: OpenRecheckFn): void {
  openRecheckHandler = handler;
}

export function unregisterOpenRecheck(): void {
  openRecheckHandler = null;
}

/**
 * Abre el modal global de recheck si hay check-in hoy; si no, va a Sentir (primer check-in).
 * Fallback: param en Hoy si el provider aún no montó.
 */
export function openRecheckCheckIn(source = 'unknown'): void {
  if (openRecheckHandler) {
    void openRecheckHandler(source);
    return;
  }
  router.push({ pathname: '/(tabs)', params: { openRecheck: '1', recheckSource: source } });
}
