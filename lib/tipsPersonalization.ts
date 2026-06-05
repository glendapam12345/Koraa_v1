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
  if (ctx.energyLevel >= 4 && tip.category === 'productivity') score += 1;
  if (['ansiosa', 'abrumada'].includes(emotion) && tip.category === 'mindset') score += 2;

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

export function countTipsByCategory(
  ctx: TipsUserContext,
  locale: AppLocale = 'es',
): Record<TipCategoryId, number> {
  const counts: Record<TipCategoryId, number> = {
    mindset: 0,
    rest: 0,
    action: 0,
    productivity: 0,
  };
  for (const tip of getPersonalizedTips(ctx, locale)) {
    counts[tip.category] += 1;
  }
  return counts;
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
      default: 'Recuperar energía también es productivo.',
      agotada: 'Con poca energía, el descanso es tu prioridad real.',
    },
    action: {
      default: 'Acciones pequeñas que no te agobian.',
      motivada: 'Buen momento para moverte — sin quemarte.',
    },
    productivity: {
      default: 'Enfócate en poco y bien. Koraa ya eligió tus focos en Hoy.',
      enfocada: 'Aprovecha el foco en tareas que importan de verdad.',
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
      default: 'Recovering energy is productive too.',
      agotada: 'Low energy? Rest is your real priority.',
    },
    action: {
      default: 'Small actions that do not overwhelm you.',
      motivada: 'Good moment to move — without burning out.',
    },
    productivity: {
      default: 'Focus on a little, done well. Koraa already picked your focus in Today.',
      enfocada: 'Use your focus on what truly matters.',
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
      'Con poca energía suele ayudar priorizar descanso y una sola acción pequeña.',
    tranquila:
      'En calma, pequeños pasos sostienen el ritmo sin presionarte.',
    ansiosa:
      'Cuando la mente va rápido, respirar y simplificar la lista suele aliviar.',
    motivada:
      'Buen impulso: canalízalo en pocas tareas con impacto, no en hacerlo todo.',
    abrumada:
      'Si te sientes abrumada, conviene aligerar: menos focos y más pausas.',
    enfocada:
      'Con claridad, conviene proteger el foco y posponer lo que no es esencial hoy.',
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
      'Good momentum: channel it into a few high-impact tasks, not everything.',
    abrumada:
      'Feeling overloaded is valid. Koraa suggests fewer focus tasks and more pauses.',
    enfocada:
      'With clarity, protect your focus and defer what is not essential today.',
  };

  const table = locale === 'en' ? en : es;
  if (table[emotion]) return table[emotion];
  if (e <= 2) return table.agotada ?? table.default;
  if (e >= 4) return table.motivada ?? table.default;
  return table.default;
}

export const TIP_CATEGORY_META: Record<
  TipCategoryId,
  { emoji: string; gradient: readonly [string, string] }
> = {
  mindset: { emoji: '🧘', gradient: ['#667eea', '#764ba2'] },
  rest: { emoji: '🌙', gradient: ['#30cfd0', '#330867'] },
  action: { emoji: '⚡', gradient: ['#fa709a', '#fee140'] },
  productivity: { emoji: '🎯', gradient: ['#4A90E2', '#FF6B6B'] },
};
