export type LifeAreaKey = 'work' | 'home' | 'health' | 'creative' | 'learning' | 'other';

export type LifeAreaRef = LifeAreaKey | `custom:${string}`;

export const CUSTOM_LIFE_AREA_PREFIX = 'custom:';

export function isCustomLifeAreaRef(value: string): value is `custom:${string}` {
  return value.startsWith(CUSTOM_LIFE_AREA_PREFIX);
}

export function makeCustomLifeAreaRef(id: string): LifeAreaRef {
  return `${CUSTOM_LIFE_AREA_PREFIX}${id}`;
}

export type LifeAreaCatalogEntry = {
  key: LifeAreaKey;
  name: string;
  emoji: string;
};

/** Valores legacy en DB → áreas genéricas para todos los usuarios. */
export const LEGACY_LIFE_AREA_ALIASES: Record<string, LifeAreaKey> = {
  koraa: 'work',
  impermanence: 'creative',
  marathon: 'health',
  personal: 'home',
};

export const LIFE_AREA_CATALOG: LifeAreaCatalogEntry[] = [
  { key: 'work', name: 'Trabajo', emoji: '💼' },
  { key: 'home', name: 'Casa y vida', emoji: '🏠' },
  { key: 'health', name: 'Salud', emoji: '💚' },
  { key: 'creative', name: 'Creativo', emoji: '🎨' },
  { key: 'learning', name: 'Aprendizaje', emoji: '📚' },
  { key: 'other', name: 'Otro', emoji: '🌿' },
];

export function isLifeAreaKey(value: string | null | undefined): value is LifeAreaKey {
  return LIFE_AREA_CATALOG.some((entry) => entry.key === value);
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function normalizeLifeAreaKey(stored: string | null | undefined): LifeAreaKey | null {
  if (!stored) return null;
  if (isLifeAreaKey(stored)) return stored;
  return LEGACY_LIFE_AREA_ALIASES[stored] ?? null;
}

const LIFE_AREA_KEYWORDS: { key: LifeAreaKey; keywords: string[] }[] = [
  {
    key: 'work',
    keywords: [
      'trabajo',
      'work',
      'cliente',
      'client',
      'office',
      'oficina',
      'reunion',
      'meeting',
      'app',
      'launch',
      'application',
      'combinator',
      'startup',
    ],
  },
  {
    key: 'health',
    keywords: ['salud', 'health', 'gym', 'doctor', 'maraton', 'marathon', 'carrera', 'correr'],
  },
  {
    key: 'creative',
    keywords: ['creative', 'creativo', 'design', 'diseno', 'video', 'reel', 'content', 'contenido'],
  },
  {
    key: 'home',
    keywords: ['casa', 'home', 'familia', 'family', 'personal', 'hogar'],
  },
  {
    key: 'learning',
    keywords: ['curso', 'course', 'learn', 'aprender', 'estudio', 'study', 'clase'],
  },
];

/** Infiere área a partir del nombre del proyecto si no hay clave guardada. */
export function inferLifeAreaKeyForProject(name: string): LifeAreaKey {
  const lower = normalizeText(name);

  for (const rule of LIFE_AREA_KEYWORDS) {
    if (rule.keywords.some((keyword) => lower.includes(normalizeText(keyword)))) {
      return rule.key;
    }
  }

  return 'other';
}

export function resolveProjectLifeAreaKey(
  stored: string | null | undefined,
  projectName: string,
): LifeAreaRef {
  if (stored && isCustomLifeAreaRef(stored)) return stored;
  const normalized = normalizeLifeAreaKey(stored);
  if (normalized) return normalized;
  return inferLifeAreaKeyForProject(projectName);
}

export function lifeAreaCatalogEntry(key: LifeAreaKey): LifeAreaCatalogEntry {
  return LIFE_AREA_CATALOG.find((entry) => entry.key === key) ?? LIFE_AREA_CATALOG[LIFE_AREA_CATALOG.length - 1];
}

export function groupProjectsByLifeArea<T extends { lifeAreaKey: LifeAreaRef }>(
  projects: T[],
): { area: LifeAreaCatalogEntry; projects: T[] }[] {
  const buckets = new Map<LifeAreaKey, T[]>();

  for (const project of projects) {
    const key = isCustomLifeAreaRef(project.lifeAreaKey) ? 'other' : project.lifeAreaKey;
    const list = buckets.get(key) ?? [];
    list.push(project);
    buckets.set(key, list);
  }

  return LIFE_AREA_CATALOG.map((area) => ({
    area,
    projects: buckets.get(area.key) ?? [],
  })).filter((group) => group.projects.length > 0);
}
