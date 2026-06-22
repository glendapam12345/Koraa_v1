import type { AppLocale, TranslationKey } from '@/lib/i18n';
import { translate } from '@/lib/i18n';
import type { GroupContextHint } from '@/lib/review/inferGroupContextHint';
import { inferGroupContextHint } from '@/lib/review/inferGroupContextHint';

const CONTEXT_EMOJI: Record<GroupContextHint, string> = {
  home: '🏠',
  work: '💼',
  venture: '✨',
  personal: '🌸',
  health: '💚',
};

function contextLabelKey(hint: GroupContextHint): TranslationKey {
  return `vaciar.areaContextLabel.${hint}` as TranslationKey;
}

/** Etiqueta amigable según el contenido del grupo (sin red — reglas locales). */
export function inferAreaContextLabel(
  tasks: { content: string }[],
  locale: AppLocale,
  fallbackLabel: string,
): string {
  const hint = inferGroupContextHint(tasks);
  if (!hint) return fallbackLabel;
  return translate(locale, contextLabelKey(hint));
}

export function inferAreaContextEmoji(
  tasks: { content: string }[],
  fallbackEmoji: string,
): string {
  const hint = inferGroupContextHint(tasks);
  if (!hint) return fallbackEmoji;
  return CONTEXT_EMOJI[hint];
}

export function inferAreaContextHint(tasks: { content: string }[]): GroupContextHint | null {
  return inferGroupContextHint(tasks);
}
