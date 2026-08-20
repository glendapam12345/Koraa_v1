import { TIPS_CATALOG_ES } from '@/lib/i18n/locales/tipsCatalog.es';
import { TIPS_CATALOG_EN } from '@/lib/i18n/locales/tipsCatalog.en';
import { isInAppTipAction } from '@/lib/tipInAppActions';

const OPTIONAL_APPS = new Set(['spotify', 'apple_music']);

function assertCatalog(catalog: typeof TIPS_CATALOG_ES) {
  expect(catalog.length).toBeGreaterThan(0);
  expect(new Set(catalog.map((t) => t.id)).size).toBe(catalog.length);

  for (const tip of catalog) {
    expect(tip.howSteps.length).toBeGreaterThanOrEqual(2);
    expect(tip.body.trim().length).toBeGreaterThan(0);
    if (tip.action) {
      expect(isInAppTipAction(tip.action)).toBe(true);
    }
    if (tip.optionalApp) {
      expect(OPTIONAL_APPS.has(tip.optionalApp)).toBe(true);
    }
  }
}

describe('tipsCatalog in-app content', () => {
  it('ES tips stay readable in-app with how steps', () => {
    assertCatalog(TIPS_CATALOG_ES);
    expect(TIPS_CATALOG_ES).toHaveLength(30);
  });

  it('EN tips stay readable in-app with how steps', () => {
    assertCatalog(TIPS_CATALOG_EN);
    expect(TIPS_CATALOG_EN).toHaveLength(30);
  });

  it('only a few tips offer optional music apps', () => {
    const withApp = TIPS_CATALOG_ES.filter((t) => t.optionalApp);
    expect(withApp.length).toBeLessThanOrEqual(4);
    expect(withApp.every((t) => !t.action || isInAppTipAction(t.action))).toBe(true);
  });
});
