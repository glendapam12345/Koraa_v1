/** CTAs que se quedan dentro de Koraa (camino principal cuando hay botón). */
export const IN_APP_TIP_ACTIONS = ['hoy', 'vaciar', 'focus_session', 'breath'] as const;

export type TipInAppAction = (typeof IN_APP_TIP_ACTIONS)[number];

export function isInAppTipAction(action: string): action is TipInAppAction {
  return (IN_APP_TIP_ACTIONS as readonly string[]).includes(action);
}
