/**
 * Emojis por categoría y sección para UI scannable y amigable (estilo Quit Now).
 */

export const CATEGORY_EMOJI: Record<string, string> = {
  trabajo: '💼',
  hogar: '🏠',
  salud: '❤️',
  personal: '🌸',
  contenido: '📝',
  marca: '✨',
  otros: '📌',
};

export const SECTION_EMOJI = {
  tareasSueltas: '📋',
  proyecto: '📁',
} as const;

export function getCategoryEmoji(category: string | undefined | null): string {
  if (!category || typeof category !== 'string') return '📌';
  const key = category.trim().toLowerCase();
  return CATEGORY_EMOJI[key] ?? '📌';
}

export function getSectionEmoji(isSuelta: boolean): string {
  return isSuelta ? SECTION_EMOJI.tareasSueltas : SECTION_EMOJI.proyecto;
}
