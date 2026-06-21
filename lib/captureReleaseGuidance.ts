import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

export type GuidanceReasonKey = 'highImpact' | 'deepWork' | 'quickWin' | 'oneThing';

export type GuidanceListItem = {
  id: string;
  content: string;
  emoji: string;
};

export type CaptureGuidance = {
  count: number;
  focus: { content: string; reasonKey: GuidanceReasonKey } | null;
  later: GuidanceListItem[];
  park: GuidanceListItem[];
};

const FOCUS_THRESHOLD = 30;
const PARK_THRESHOLD = 35;

function isWellnessPark(content: string): boolean {
  return /\b(no colapsar|respirar|descansar|meditar|autocuidado|cuidarme|relajar|calma|no pensar en|solo ser|pausa mental)\b/i.test(
    content,
  );
}

function isContentCreation(content: string): boolean {
  return /\b(reel|video|comercial|publicar|subir|post|instagram|tiktok|contenido|stories|youtube|grabar)\b/i.test(
    content,
  );
}

function pickEmoji(content: string, bucket: 'later' | 'park'): string {
  if (bucket === 'park') return '🌱';
  if (/\b(reel|video|grabar|youtube|tiktok)\b/i.test(content)) return '🎥';
  if (/\b(comercial|publicar|subir|post|instagram|marketing|anuncio)\b/i.test(content)) return '📢';
  if (/\b(llamar|call|email|correo)\b/i.test(content)) return '📞';
  if (/\b(comprar|pagar|sat|banco)\b/i.test(content)) return '✓';
  return '·';
}

function impactScore(item: EnrichedCaptureItem): number {
  const lower = item.content.toLowerCase();
  let score = 0;
  if (isWellnessPark(lower)) return -100;
  if (item.effortFeel === 'heavy') score += 35;
  if (item.effortFeel === 'medium') score += 10;
  if (
    /\b(pitch|propuesta|deck|estrategia|strategy|lanzamiento|launch|fundraising|inversor|investor|roadmap)\b/i.test(
      lower,
    )
  ) {
    score += 40;
  }
  if (
    /\b(preparar|prepare|planificar|investigar|research)\b/i.test(lower) &&
    item.effortFeel !== 'light'
  ) {
    score += 20;
  }
  if (/\b(urgente|urgent|crucial|importante)\b/i.test(lower)) score += 15;
  return score;
}

function parkScore(item: EnrichedCaptureItem): number {
  const lower = item.content.toLowerCase();
  let score = 0;
  if (isWellnessPark(lower)) score += 70;
  if (item.timing === 'later' && item.effortFeel === 'light' && !isContentCreation(lower)) score += 20;
  if (item.effortFeel === 'light' && item.timing === 'later') score += 15;
  return score;
}

function laterScore(item: EnrichedCaptureItem): number {
  const lower = item.content.toLowerCase();
  if (isWellnessPark(lower)) return -50;
  let score = 15;
  if (item.timing === 'this_week') score += 25;
  if (isContentCreation(lower)) score += 35;
  if (item.effortFeel === 'medium') score += 20;
  if (item.timing === 'today' && item.effortFeel === 'light') score += 30;
  if (/\b(revisar|reporte|actualizar|seguimiento)\b/i.test(lower)) score += 20;
  if (impactScore(item) >= FOCUS_THRESHOLD) score -= 40;
  return score;
}

export function pickGuidanceReasonKey(item: EnrichedCaptureItem): GuidanceReasonKey {
  const lower = item.content.toLowerCase();
  if (/\b(pitch|propuesta|deck|fundraising|inversor|investor)\b/i.test(lower)) return 'highImpact';
  if (item.effortFeel === 'heavy') return 'deepWork';
  if (item.timing === 'today' && item.effortFeel === 'light') return 'quickWin';
  return 'oneThing';
}

/** Convierte tareas enriquecidas en guía de atención — no en metadatos. */
export function buildCaptureGuidance(items: EnrichedCaptureItem[]): CaptureGuidance {
  if (items.length === 0) {
    return { count: 0, focus: null, later: [], park: [] };
  }

  if (items.length === 1) {
    const item = items[0];
    if (parkScore(item) >= PARK_THRESHOLD || isWellnessPark(item.content)) {
      return {
        count: 1,
        focus: null,
        later: [],
        park: [{ id: item.id, content: item.content, emoji: pickEmoji(item.content, 'park') }],
      };
    }
    return {
      count: 1,
      focus: { content: item.content, reasonKey: pickGuidanceReasonKey(item) },
      later: [],
      park: [],
    };
  }

  const ranked = items.map((item) => ({
    item,
    impact: impactScore(item),
    park: parkScore(item),
    later: laterScore(item),
  }));

  const byImpact = [...ranked].sort((a, b) => b.impact - a.impact);
  const top = byImpact[0];

  let focusItem: EnrichedCaptureItem | null = null;
  if (top.impact >= FOCUS_THRESHOLD) {
    focusItem = top.item;
  } else {
    const bestNonPark = byImpact.find((row) => row.park < PARK_THRESHOLD);
    if (bestNonPark && bestNonPark.impact > 0) {
      focusItem = bestNonPark.item;
    }
  }

  const later: GuidanceListItem[] = [];
  const park: GuidanceListItem[] = [];

  for (const row of ranked) {
    if (focusItem && row.item.id === focusItem.id) continue;

    if (row.park >= PARK_THRESHOLD && row.park >= row.later) {
      park.push({
        id: row.item.id,
        content: row.item.content,
        emoji: pickEmoji(row.item.content, 'park'),
      });
    } else {
      later.push({
        id: row.item.id,
        content: row.item.content,
        emoji: pickEmoji(row.item.content, 'later'),
      });
    }
  }

  if (!focusItem && later.length > 0) {
    const promoted = ranked
      .filter((row) => later.some((entry) => entry.id === row.item.id))
      .sort((a, b) => b.impact - a.impact)[0];
    if (promoted) {
      const nextLater = later.filter((entry) => entry.id !== promoted.item.id);
      return {
        count: items.length,
        focus: {
          content: promoted.item.content,
          reasonKey: pickGuidanceReasonKey(promoted.item),
        },
        later: nextLater,
        park,
      };
    }
  }

  return {
    count: items.length,
    focus: focusItem
      ? { content: focusItem.content, reasonKey: pickGuidanceReasonKey(focusItem) }
      : null,
    later,
    park,
  };
}
