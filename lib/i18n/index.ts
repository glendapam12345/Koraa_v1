import { en } from './locales/en';
import { es } from './locales/es';
import type { TranslationTree } from './locales/es';

export type AppLocale = 'es' | 'en';

const catalogs: Record<AppLocale, TranslationTree> = { es, en };

export function getCatalog(locale: AppLocale): TranslationTree {
  return catalogs[locale];
}

export type TranslationKey = string;

function getNestedValue(tree: TranslationTree, key: string): string | undefined {
  const parts = key.split('.');
  let node: unknown = tree;
  for (const part of parts) {
    if (node == null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = params[name];
    return value === undefined ? `{{${name}}}` : String(value);
  });
}

export function translate(
  locale: AppLocale,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const raw = getNestedValue(getCatalog(locale), key);
  if (!raw) return key;
  return interpolate(raw, params);
}

export function resolveDeviceLocale(): AppLocale {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Localization = require('expo-localization') as {
      getLocales: () => { languageCode?: string | null }[];
    };
    const code = Localization.getLocales()[0]?.languageCode ?? 'es';
    return code.toLowerCase().startsWith('en') ? 'en' : 'es';
  } catch {
    if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')) {
      return 'en';
    }
    return 'es';
  }
}
