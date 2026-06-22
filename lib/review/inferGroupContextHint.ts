import { detectCategory } from '@/lib/categoryDetection';

export type GroupContextHint = 'work' | 'home' | 'venture' | 'personal' | 'health';

const HOME_KEYWORDS = [
  'casa',
  'hogar',
  'home',
  'limpieza',
  'lavar',
  'lavanderia',
  'laundry',
  'cocina',
  'kitchen',
  'recoger',
  'super',
  'supermercado',
  'grocery',
  'planta',
  'mascota',
  'perro',
  'gato',
];

const VENTURE_KEYWORDS = [
  'emprendimiento',
  'negocio',
  'side hustle',
  'startup',
  'tienda',
  'ecommerce',
  'e-commerce',
  'marca propia',
  'coleccion',
  'colección',
  'reel',
  'instagram',
  'cliente propio',
  'freelance',
  'ventas online',
  'producto',
  'lanzamiento',
  'venture',
  'business',
  'shop',
  'brand',
];

function scoreKeywordHits(content: string, keywords: string[]): number {
  const lower = content.toLowerCase();
  return keywords.filter((keyword) => lower.includes(keyword)).length;
}

export function inferGroupContextHint(
  tasks: { content: string }[],
  groupName = '',
): GroupContextHint | null {
  const scores: Record<GroupContextHint, number> = {
    work: 0,
    home: 0,
    venture: 0,
    personal: 0,
    health: 0,
  };

  const scoreText = (content: string, weight = 1) => {
    scores.work += scoreKeywordHits(content, [
      'trabajo',
      'oficina',
      'reunión',
      'cliente',
      'jefe',
      'equipo',
      'work',
      'office',
      'meeting',
      'boss',
    ]) * weight;
    scores.home += scoreKeywordHits(content, HOME_KEYWORDS) * weight;
    scores.venture += scoreKeywordHits(content, VENTURE_KEYWORDS) * weight;

    const cat = detectCategory(content);
    if (cat === 'trabajo') scores.work += weight;
    else if (cat === 'personal') scores.personal += weight;
    else if (cat === 'salud') scores.health += weight;
  };

  for (const task of tasks) scoreText(task.content);
  if (groupName.trim()) scoreText(groupName, 2);

  const ranked = (Object.entries(scores) as [GroupContextHint, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  const [bestKey, bestScore] = ranked[0];
  if (!bestScore) return null;

  const secondScore = ranked[1]?.[1] ?? 0;
  if (secondScore === bestScore) return null;

  return bestKey;
}
