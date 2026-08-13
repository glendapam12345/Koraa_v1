/**
 * Personalización de consejos por emoción, energía y patrones.
 * Sin API externa: scoring local + frases guía (listo para conectar IA vía Edge Function después).
 *
 * Futuro IA: EXPO_PUBLIC_TIPS_AI_URL + función Supabase que reciba emotion/energy y devuelva tips.
 */

import type { AppLocale } from '@/lib/i18n';
import { TIPS_CATALOG_ES, type CatalogTipEntry } from '@/lib/i18n/locales/tipsCatalog.es';
import { TIPS_CATALOG_EN } from '@/lib/i18n/locales/tipsCatalog.en';
import type { TipCategoryId, TipsUserContext } from '@/lib/tipsTypes';
import { getCatalogCountByCategory } from '@/lib/tipsAccess';

export type ScoredTip = CatalogTipEntry & { score: number; forYou?: boolean };

function catalogForLocale(locale: AppLocale): CatalogTipEntry[] {
  return locale === 'en' ? TIPS_CATALOG_EN : TIPS_CATALOG_ES;
}

function scoreTip(tip: CatalogTipEntry, ctx: TipsUserContext): number {
  let score = 1;
  const emotion = ctx.emotion.toLowerCase();

  if (tip.emotions?.includes(emotion)) score += 4;
  if (tip.minEnergy != null && ctx.energyLevel >= tip.minEnergy) score += 1;
  if (tip.maxEnergy != null && ctx.energyLevel <= tip.maxEnergy) score += 1;
  if (tip.minEnergy != null && ctx.energyLevel < tip.minEnergy) score -= 2;
  if (tip.maxEnergy != null && ctx.energyLevel > tip.maxEnergy) score -= 2;

  if (ctx.energyLevel <= 2 && tip.category === 'rest') score += 2;
  if (['ansiosa', 'abrumada'].includes(emotion) && tip.category === 'mindset') score += 2;
  if (['ansiosa', 'abrumada', 'agotada'].includes(emotion) && tip.category === 'rest') score += 1;

  if (
    ctx.energyLevel >= 4 &&
    tip.category === 'action' &&
    ['motivada', 'enfocada', 'tranquila'].includes(emotion)
  ) {
    score += 1;
  }

  if (['ansiosa', 'abrumada', 'agotada'].includes(emotion) && tip.category === 'productivity') {
    score -= 2;
  }
  if (ctx.energyLevel <= 2 && tip.category === 'productivity') score -= 1;

  return score;
}

export function getPersonalizedTips(
  ctx: TipsUserContext,
  locale: AppLocale = 'es',
): ScoredTip[] {
  const catalog = catalogForLocale(locale);
  const scored = catalog
    .map((tip) => {
      const score = scoreTip(tip, ctx);
      return { ...tip, score, forYou: score >= 5 };
    })
    .sort((a, b) => b.score - a.score);

  return scored;
}

export function getTipsForCategory(
  category: TipCategoryId,
  ctx: TipsUserContext,
  locale: AppLocale = 'es',
): ScoredTip[] {
  return getPersonalizedTips(ctx, locale).filter((t) => t.category === category);
}

/** @deprecated Usa getDisplayTipsCountByCategory en lib/tipsAccess (respeta límite gratis). */
export function countTipsByCategory(
  _ctx: TipsUserContext,
  locale: AppLocale = 'es',
): Record<TipCategoryId, number> {
  return getCatalogCountByCategory(locale);
}

/** Frase guía tipo Musa — adaptada al check-in (sin LLM). */
export function getCategoryLead(
  category: TipCategoryId,
  ctx: TipsUserContext,
  locale: AppLocale = 'es',
): string {
  const emotion = ctx.emotion.toLowerCase();
  const e = ctx.energyLevel;

  const es: Record<TipCategoryId, Record<string, string>> = {
    mindset: {
      default:
        'Ideas para tu mente hoy. Con un tip ya te estás ayudando — no hace falta hacerlos todos.',
      agotada: 'Tu mente pide pausa. Elige un tip suave; el resto puede esperar.',
      ansiosa: 'Respira primero. Estos tips van despacio, a tu ritmo.',
      abrumada: 'Mucho encima es válido. Un paso mental a la vez.',
    },
    rest: {
      default: 'Recuperar también cuenta. Elige un tip suave.',
      agotada: 'Con poca energía, el descanso puede ser lo más importante hoy.',
    },
    action: {
      default: 'Pasos pequeños que no te agobian.',
      motivada: 'Si te apetece moverte — sin quemarte.',
    },
    productivity: {
      default: 'Qué importa hoy está en Hoy. Un paso basta.',
      enfocada: 'Con claridad, una cosa que importe puede ser suficiente.',
    },
  };

  const en: Record<TipCategoryId, Record<string, string>> = {
    mindset: {
      default:
        'Ideas for your mind today. One tip is enough — you do not need to do them all.',
      agotada: 'Your mind is asking for pause. Pick one gentle tip.',
      ansiosa: 'Breathe first. These tips go at your pace.',
      abrumada: 'Feeling overloaded is valid. One mental step at a time.',
    },
    rest: {
      default: 'Resting counts too. Pick one gentle tip.',
      agotada: 'Low energy? Rest may be the most important thing today.',
    },
    action: {
      default: 'Small steps that do not overwhelm you.',
      motivada: 'If you feel up to moving — without burning out.',
    },
    productivity: {
      default: 'What matters today lives in Today. One step is enough.',
      enfocada: 'With clarity, one thing that matters can be enough.',
    },
  };

  const table = locale === 'en' ? en : es;
  const cat = table[category];
  if (cat[emotion]) return cat[emotion];
  if (e <= 2 && category === 'rest' && cat.agotada) return cat.agotada;
  return cat.default ?? table[category].default;
}

/** Insight breve para cabecera de Consejos (patrones, no horóscopo). */
export function getTipsDailyInsight(
  ctx: TipsUserContext,
  locale: AppLocale = 'es',
): string {
  const emotion = ctx.emotion.toLowerCase();
  const e = ctx.energyLevel;

  const es: Record<string, string> = {
    default:
      'Tus consejos se adaptan a cómo te sientes hoy. Un tip a la vez basta.',
    agotada:
      'Con poca energía suele ayudar descansar primero y, si puedes, un paso pequeño.',
    tranquila:
      'En calma, pequeños pasos sostienen el ritmo sin presionarte.',
    ansiosa:
      'Cuando la mente va rápido, respirar y simplificar la lista suele aliviar.',
    motivada:
      'Buen impulso: canalízalo en una o dos cosas, no en hacerlo todo.',
    abrumada:
      'Si te sientes abrumada, conviene aligerar: menos pasos y más pausas.',
    enfocada:
      'Con claridad, protege este momento para una cosa que importe. El resto puede esperar.',
  };

  const en: Record<string, string> = {
    default:
      'Tips adapt to how you feel today. One at a time is enough.',
    agotada:
      'Low energy often calls for rest first and one tiny action.',
    tranquila:
      'When calm, small steady steps work better than big pushes.',
    ansiosa:
      'When your mind races, breathing and a shorter list usually help.',
    motivada:
      'Good momentum: channel it into one or two things, not everything.',
    abrumada:
      'Feeling overloaded is valid. Fewer steps and more pauses usually help.',
    enfocada:
      'With clarity, protect this moment for one thing that matters. The rest can wait.',
  };

  const table = locale === 'en' ? en : es;
  if (table[emotion]) return table[emotion];
  if (e <= 2) return table.agotada ?? table.default;
  if (e >= 4) return table.motivada ?? table.default;
  return table.default;
}

export const TIP_CATEGORY_META: Record<
  TipCategoryId,
  {
    emoji: string;
    /** Bold gradients for category grid cards */
    gradient: readonly [string, string];
    /** Softer, muted gradients for daily tip carousel — distinct from grid */
    highlightGradient: readonly [string, string];
  }
> = {
  mindset: {
    emoji: '🧘',
    gradient: ['#1B3A6B', '#2EC4B6'],
    highlightGradient: ['#C4B0E8', '#E2D4F5'],
  },
  rest: {
    emoji: '🌙',
    gradient: ['#0F3D3E', '#1B6B4A'],
    highlightGradient: ['#9DD4E3', '#C5EAF2'],
  },
  action: {
    emoji: '⚡',
    gradient: ['#E85D4C', '#F5C542'],
    highlightGradient: ['#EDB0C8', '#F5D4E4'],
  },
  productivity: {
    emoji: '📋',
    gradient: ['#6B4C9A', '#C45B8C'],
    highlightGradient: ['#A8DDE8', '#F5D0C8'],
  },
};
