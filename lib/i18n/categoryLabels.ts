import type { AppLocale } from './index';
import { getCatalog } from './index';
import type { CategoryKey } from './locales/features/categories';

const LABEL_TO_KEY: Record<string, CategoryKey> = {
  hogar: 'hogar',
  home: 'hogar',
  trabajo: 'trabajo',
  work: 'trabajo',
  personal: 'personal',
  salud: 'salud',
  health: 'salud',
  contenido: 'contenido',
  content: 'contenido',
  marca: 'marca',
  brand: 'marca',
  otros: 'otros',
  other: 'otros',
};

export function normalizeCategoryKey(value: string): CategoryKey | null {
  const k = value.trim().toLowerCase();
  return LABEL_TO_KEY[k] ?? null;
}

export function categoryLabel(locale: AppLocale, value: string): string {
  const key = normalizeCategoryKey(value);
  if (!key) return value.trim() || getCatalog(locale).categories.otros;
  return getCatalog(locale).categories[key];
}

export const CATEGORY_ORDER_KEYS: CategoryKey[] = [
  'hogar',
  'trabajo',
  'personal',
  'salud',
  'contenido',
  'marca',
  'otros',
];
