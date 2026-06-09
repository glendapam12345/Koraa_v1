const HEAVY_EMOTIONS = new Set(['agotada', 'ansiosa', 'abrumada']);

/** Usuario llega con carga emocional alta — priorizar seguridad sobre productividad. */
export function isOverwhelmedState(emotionKey: string, energyLevel: number): boolean {
  const e = emotionKey.toLowerCase();
  return energyLevel <= 2 || HEAVY_EMOTIONS.has(e);
}
