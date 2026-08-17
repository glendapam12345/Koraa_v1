export type FirstDayCloseCue = {
  withTime: boolean;
  timeLabel: string;
};

/**
 * Día 0: el valor es un paso + una cita suave para mañana.
 * Sin check-in o fuera del día lite → no se muestra (anti-ruido).
 */
export function resolveFirstDayCloseCue(params: {
  isLiteDay: boolean;
  hasCheckIn: boolean;
  crisisMode?: boolean;
  reminderOptedIn: boolean;
  reminderTimeLabel: string;
}): FirstDayCloseCue | null {
  const {
    isLiteDay,
    hasCheckIn,
    crisisMode = false,
    reminderOptedIn,
    reminderTimeLabel,
  } = params;
  if (!isLiteDay || !hasCheckIn || crisisMode) return null;
  const timeLabel = reminderTimeLabel.trim();
  return {
    withTime: reminderOptedIn && Boolean(timeLabel),
    timeLabel,
  };
}
