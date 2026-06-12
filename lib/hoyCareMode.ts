/** Pasos sugeridos visibles en Hoy cuando el modo cuidado está activo. */
export const CARE_MODE_MAX_FOCUS_STEPS = 1;

export function getCareModeTaskCounts(focusCount: number, restCount: number) {
  const visibleFocus = Math.min(focusCount, CARE_MODE_MAX_FOCUS_STEPS);
  const hiddenFocus = Math.max(0, focusCount - visibleFocus);
  return {
    visibleFocus,
    waitingCount: restCount + hiddenFocus,
  };
}
