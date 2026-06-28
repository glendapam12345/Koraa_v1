import type { ScoredTip } from '@/lib/tipsPersonalization';

/** Reordena tips poniendo primero los IDs elegidos por el cerebro Koraa. */
export function applyTipHighlights(tips: ScoredTip[], highlightIds: string[]): ScoredTip[] {
  if (highlightIds.length === 0) return tips;

  const byId = new Map(tips.map((tip) => [tip.id, tip]));
  const highlighted: ScoredTip[] = [];
  const seen = new Set<string>();

  for (const id of highlightIds) {
    const tip = byId.get(id);
    if (!tip || seen.has(id)) continue;
    seen.add(id);
    highlighted.push({ ...tip, forYou: true });
  }

  const rest = tips
    .filter((tip) => !seen.has(tip.id))
    .map((tip) => ({ ...tip, forYou: tip.forYou ?? false }));

  return [...highlighted, ...rest];
}
