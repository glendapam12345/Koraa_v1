import {
  buildAreaConfigFromOnboardingSelections,
  buildDefaultOnboardingAreaConfig,
  getOnboardingSelectableAreaRefs,
} from '@/lib/review/onboardingAreaSelection';
import { EMPTY_USER_LIFE_AREAS, resolveAreaColumnOrder } from '@/lib/lifeAreas/userLifeAreas';
import { makeCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { BRAIN_DUMP_PRESET_CUSTOM_IDS } from '@/lib/review/brainDumpAreaPreset';

describe('onboardingAreaSelection', () => {
  it('exposes three selectable preset areas', () => {
    expect(getOnboardingSelectableAreaRefs()).toEqual([
      'home',
      makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.personal),
      'work',
    ]);
  });

  it('only keeps enabled areas visible in column order', () => {
    const config = buildAreaConfigFromOnboardingSelections(EMPTY_USER_LIFE_AREAS, [
      { ref: 'home', enabled: true, name: 'Casa', examples: '' },
      {
        ref: makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.personal),
        enabled: false,
        name: 'Personal',
        examples: '',
      },
      { ref: 'work', enabled: true, name: 'Trabajo', examples: '' },
    ]);

    expect(resolveAreaColumnOrder(config)).toEqual(['home', 'work']);
    expect(config.hiddenAreaRefs).toContain(
      makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.personal),
    );
    expect(config.labels.home).toBe('Casa');
  });

  it('default skip config enables home, personal and work', () => {
    const config = buildDefaultOnboardingAreaConfig(EMPTY_USER_LIFE_AREAS);
    expect(resolveAreaColumnOrder(config)).toEqual([
      'home',
      makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.personal),
      'work',
    ]);
    expect(config.hiddenAreaRefs).toContain('other');
  });

  it('always keeps other hidden after onboarding save', () => {
    const config = buildAreaConfigFromOnboardingSelections(EMPTY_USER_LIFE_AREAS, [
      { ref: 'home', enabled: true, name: 'Hogar', examples: '' },
      {
        ref: makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.personal),
        enabled: true,
        name: 'Personal',
        examples: '',
      },
      { ref: 'work', enabled: true, name: 'Trabajo', examples: '' },
    ]);
    expect(config.hiddenAreaRefs).toContain('other');
  });
});
