import {
  EMPTY_USER_LIFE_AREAS,
  hideAreaInConfig,
  isAreaHidden,
  removeAreaFromUserConfig,
  resolveAreaColumnOrder,
} from '@/lib/lifeAreas/userLifeAreas';
import { makeCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { BRAIN_DUMP_PRESET_CUSTOM_IDS } from '@/lib/review/brainDumpAreaPreset';

describe('removeAreaFromUserConfig', () => {
  it('hides builtin areas instead of deleting them', () => {
    const next = removeAreaFromUserConfig(EMPTY_USER_LIFE_AREAS, 'work');
    expect(isAreaHidden(next, 'work')).toBe(true);
    expect(resolveAreaColumnOrder(next)).not.toContain('work');
  });

  it('hides preset custom areas', () => {
    const config = {
      ...EMPTY_USER_LIFE_AREAS,
      custom: [
        {
          id: BRAIN_DUMP_PRESET_CUSTOM_IDS.familia,
          name: 'Familia',
          emoji: '👨‍👩‍👧',
        },
      ],
    };
    const ref = makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.familia);
    const next = removeAreaFromUserConfig(config, ref);
    expect(isAreaHidden(next, ref)).toBe(true);
    expect(next.custom.some((entry) => entry.id === BRAIN_DUMP_PRESET_CUSTOM_IDS.familia)).toBe(
      true,
    );
  });

  it('removes user-created custom areas', () => {
    const config = {
      ...EMPTY_USER_LIFE_AREAS,
      custom: [{ id: 'auser123', name: 'Mascotas', emoji: '🐾' }],
    };
    const ref = makeCustomLifeAreaRef('auser123');
    const next = removeAreaFromUserConfig(config, ref);
    expect(next.custom).toHaveLength(0);
    expect(isAreaHidden(next, ref)).toBe(false);
  });
});

describe('hideAreaInConfig', () => {
  it('stores hidden refs uniquely', () => {
    const once = hideAreaInConfig(EMPTY_USER_LIFE_AREAS, 'home');
    const twice = hideAreaInConfig(once, 'home');
    expect(twice.hiddenAreaRefs).toEqual(['home']);
  });
});
