import type { ParamiPatternInput } from '@/lib/paramiPatternInsight';

/** Fingerprint that changes when mood, energy, or task completions change. */
export function buildParamiPatternInputKey(input: ParamiPatternInput): string {
  const daySig = input.days
    .map((d) => `${d.date}:${d.hasCheckIn ? 1 : 0}:${d.emotion ?? ''}:${d.energyLevel ?? ''}`)
    .join('|');
  const emotionSig = input.emotionMix.map((e) => `${e.id}:${e.count}`).join(',');
  const tasks = input.tasks ?? [];
  const completed = tasks.filter((t) => t.is_completed).length;
  const taskSig = tasks
    .map((t) => `${t.id}:${t.is_completed ? 1 : 0}:${t.completed_at ?? ''}`)
    .sort()
    .join(',');
  return [
    input.period,
    input.locale,
    input.isPremium ? '1' : '0',
    `d${input.days.length}`,
    `c${completed}`,
    `t${tasks.length}`,
    emotionSig,
    daySig,
    taskSig,
  ].join('__');
}

/** Digest estable y corto; dual-hash + length reduce colisiones vs un solo 32-bit. */
export function digestParamiPatternFingerprint(fp: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < fp.length; i += 1) {
    const c = fp.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x811c9dc5) + (i + 1);
  }
  return `${(h1 >>> 0).toString(36)}_${(h2 >>> 0).toString(36)}_n${fp.length.toString(36)}`;
}
