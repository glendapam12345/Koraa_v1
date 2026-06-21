import type { CaptureFront } from '@/lib/captureProjectFronts';
import { PROJECT_COLORS } from '@/lib/projectColors';

export type FrontTheme = {
  bg: string;
  border: string;
  accent: string;
  taskBg: string;
};

const KEY_THEMES: Record<string, FrontTheme> = {
  koraa: {
    bg: '#EDE8FF',
    border: '#B8A8F0',
    accent: '#7C5CE0',
    taskBg: '#F5F2FF',
  },
  impermanence: {
    bg: '#FFE8F0',
    border: '#F0A8C8',
    accent: '#D976A8',
    taskBg: '#FFF5F8',
  },
  marathon: {
    bg: '#E8F4FF',
    border: '#8EC5F0',
    accent: '#4A9AD4',
    taskBg: '#F0F8FF',
  },
  personal: {
    bg: '#E8FFF0',
    border: '#7ED4A0',
    accent: '#3DA86A',
    taskBg: '#F2FFF6',
  },
  family: {
    bg: '#FFECE8',
    border: '#F0A890',
    accent: '#E87860',
    taskBg: '#FFF5F2',
  },
  finance: {
    bg: '#FFF8E8',
    border: '#F0D080',
    accent: '#D4A830',
    taskBg: '#FFFCF0',
  },
  health: {
    bg: '#E8FFF4',
    border: '#6BCB9A',
    accent: '#2E9E6E',
    taskBg: '#F0FFF8',
  },
  work: {
    bg: '#E8EEFF',
    border: '#7EB3F0',
    accent: '#4A8AD4',
    taskBg: '#F0F5FF',
  },
  loose: {
    bg: '#F4F4F6',
    border: '#D0D0D8',
    accent: '#888890',
    taskBg: '#FAFAFA',
  },
};

const FALLBACK_THEMES: FrontTheme[] = Object.values(KEY_THEMES);

function hashIndex(value: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash + value.charCodeAt(i) * (i + 1)) % modulo;
  }
  return hash;
}

export function frontThemeForFront(front: Pick<CaptureFront, 'key' | 'name'>, index = 0): FrontTheme {
  const normalized = front.key.toLowerCase();
  if (KEY_THEMES[normalized]) return KEY_THEMES[normalized];

  const nameKey = front.name.toLowerCase().replace(/\s+/g, '');
  for (const [key, theme] of Object.entries(KEY_THEMES)) {
    if (nameKey.includes(key)) return theme;
  }

  const color = PROJECT_COLORS[hashIndex(front.key, PROJECT_COLORS.length)];
  return {
    bg: `${color}22`,
    border: `${color}88`,
    accent: color,
    taskBg: `${color}14`,
  };
}

export function frontThemeByIndex(index: number): FrontTheme {
  return FALLBACK_THEMES[index % FALLBACK_THEMES.length];
}

export function frontThemeForKey(key: string, index = 0): FrontTheme {
  const normalized = key.toLowerCase();
  if (KEY_THEMES[normalized]) return KEY_THEMES[normalized];
  if (normalized === 'other') return KEY_THEMES.loose;
  return frontThemeByIndex(index);
}
