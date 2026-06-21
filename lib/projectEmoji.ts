import { INFERRED_FRONT_PATTERNS } from '@/lib/captureProjectFronts';

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** Emoji suave por nombre de proyecto — sin inventar categorías nuevas. */
export function getProjectEmoji(name: string): string {
  const lower = normalizeText(name);
  for (const pattern of INFERRED_FRONT_PATTERNS) {
    if (normalizeText(pattern.name) === lower) return pattern.emoji;
    if (pattern.keywords.some((keyword) => lower.includes(normalizeText(keyword)))) {
      return pattern.emoji;
    }
  }
  return '📁';
}
