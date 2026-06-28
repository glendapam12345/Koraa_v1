import type { CheckInData } from '@/lib/smartPrioritization';
import type { TaskCandidate } from '@/lib/ai/types';

const NEGATIVE_EMOTIONS = ['agotada', 'ansiosa', 'abrumada'];

/** Máximo de pasos sugeridos según energía y emoción (anti-sobrecarga). */
export function resolveMaxFocusTaskCount(checkIn: CheckInData): number {
  const emotion = checkIn.emotion.toLowerCase();
  if (checkIn.energyLevel <= 2 || NEGATIVE_EMOTIONS.includes(emotion)) return 2;
  if (checkIn.energyLevel === 3) return 3;
  if (checkIn.energyLevel >= 4) return 5;
  return 4;
}

/** Valida y recorta IDs del cerebro contra candidatos y límites del día. */
export function resolveAiFocusTaskIds(
  rawIds: string[] | undefined,
  candidates: TaskCandidate[],
  checkIn: CheckInData,
): string[] {
  if (!rawIds?.length || candidates.length === 0) return [];

  const valid = new Set(candidates.map((task) => task.id));
  const max = resolveMaxFocusTaskCount(checkIn);
  const seen = new Set<string>();
  const resolved: string[] = [];

  for (const id of rawIds) {
    if (!valid.has(id) || seen.has(id)) continue;
    seen.add(id);
    resolved.push(id);
    if (resolved.length >= max) break;
  }

  return resolved;
}
