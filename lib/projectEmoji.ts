const THEME_EMOJIS: { keywords: string[]; emoji: string }[] = [
  { keywords: ['trabajo', 'work', 'office', 'oficina', 'reunion', 'meeting'], emoji: '💼' },
  { keywords: ['salud', 'health', 'gym', 'doctor', 'maraton', 'marathon', 'carrera'], emoji: '💚' },
  { keywords: ['casa', 'home', 'familia', 'family', 'hogar'], emoji: '🏠' },
  { keywords: ['creative', 'creativo', 'design', 'diseno', 'video', 'reel', 'content'], emoji: '🎨' },
  { keywords: ['curso', 'course', 'learn', 'aprender', 'estudio', 'study'], emoji: '📚' },
  { keywords: ['cine', 'movie', 'pelicula', 'boletos', 'tickets'], emoji: '🎬' },
  { keywords: ['comida', 'food', 'cocina', 'recipe'], emoji: '🍽️' },
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** Emoji suave por nombre de proyecto — sin marcas fijas. */
export function getProjectEmoji(name: string): string {
  const lower = normalizeText(name);
  for (const theme of THEME_EMOJIS) {
    if (theme.keywords.some((keyword) => lower.includes(normalizeText(keyword)))) {
      return theme.emoji;
    }
  }
  return '📁';
}
