import { TIPS_CATALOG_ES } from '@/lib/i18n/locales/tipsCatalog.es';
import { TIPS_CATALOG_EN } from '@/lib/i18n/locales/tipsCatalog.en';
import type { TipAction } from '@/lib/tipActions';

const KNOWN_ACTIONS = new Set<TipAction>([
  'spotify',
  'apple_music',
  'focus_session',
  'notes',
  'reminders',
  'health_mindfulness',
  'health_sleep',
  'health',
  'messages',
  'maps',
  'clock',
  'hoy',
  'vaciar',
]);

function assertCatalogActions(catalog: typeof TIPS_CATALOG_ES, locale: string) {
  for (const tip of catalog) {
    expect(tip.action).toBeDefined();
    expect(KNOWN_ACTIONS.has(tip.action)).toBe(true);
  }
  expect(catalog.length).toBeGreaterThan(0);
  expect(catalog.every((t) => t.action)).toBe(true);
  expect(new Set(catalog.map((t) => t.id)).size).toBe(catalog.length);
  void locale;
}

describe('tipsCatalog actions', () => {
  it('every ES tip has a known native action', () => {
    assertCatalogActions(TIPS_CATALOG_ES, 'es');
    expect(TIPS_CATALOG_ES).toHaveLength(30);
  });

  it('every EN tip has a known native action', () => {
    assertCatalogActions(TIPS_CATALOG_EN, 'en');
    expect(TIPS_CATALOG_EN).toHaveLength(30);
  });
});
