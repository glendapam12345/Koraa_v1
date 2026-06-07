/** Hora local a partir de la cual «Pausa ahora» prioriza meditación nocturna. */
export const MEDITATION_EVENING_HOUR = 17;

export function getSituationalMeditationType(
  morningDone: boolean,
  eveningDone: boolean,
  now: Date = new Date(),
): 'morning' | 'evening' {
  const hour = now.getHours();
  const preferEvening = hour >= MEDITATION_EVENING_HOUR;

  if (preferEvening) {
    if (!eveningDone) return 'evening';
    if (!morningDone) return 'morning';
    return 'evening';
  }

  if (!morningDone) return 'morning';
  if (!eveningDone) return 'evening';
  return 'morning';
}
