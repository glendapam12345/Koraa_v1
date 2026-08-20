import { pushToHoyTab } from '@/lib/tabNavigation';

export type OpenRecheckFn = (source?: string) => void | Promise<void>;

let openRecheckHandler: OpenRecheckFn | null = null;

export function registerOpenRecheck(handler: OpenRecheckFn): void {
  openRecheckHandler = handler;
}

export function unregisterOpenRecheck(): void {
  openRecheckHandler = null;
}

/**
 * Abre el modal global de recheck si hay check-in hoy; si no, va a Hoy (check-in embebido).
 * Fallback: param en Hoy si el provider aún no montó.
 */
export function openRecheckCheckIn(source = 'unknown'): void {
  if (openRecheckHandler) {
    void openRecheckHandler(source);
    return;
  }
  pushToHoyTab({ openRecheck: '1', recheckSource: source });
}
