import { buildOnboardingCaptureItems } from '@/lib/onboardingCaptureBuild';
import { buildDefaultOnboardingAreaConfig } from '@/lib/review/onboardingAreaSelection';
import { EMPTY_USER_LIFE_AREAS } from '@/lib/lifeAreas/userLifeAreas';
import { makeCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { BRAIN_DUMP_PRESET_CUSTOM_IDS } from '@/lib/review/brainDumpAreaPreset';

describe('onboardingCapture', () => {
  it('parses multiline input into loose tasks with inferred areas', () => {
    const config = buildDefaultOnboardingAreaConfig({
      ...EMPTY_USER_LIFE_AREAS,
      examples: { work: 'reuniones, correos' },
    });

    const items = buildOnboardingCaptureItems(
      'Preparar reunión con el equipo\nComprar mandados',
      'es',
      config,
    );

    expect(items).toHaveLength(2);
    expect(items[0]?.lifeAreaKey).toBe('work');
    expect(items.every((item) => item.assignToProject === false)).toBe(true);
    expect(items.every((item) => item.selectedCategory === '')).toBe(true);
  });

  it('uses personal custom area when examples match', () => {
    const config = buildDefaultOnboardingAreaConfig(EMPTY_USER_LIFE_AREAS);
    const personalRef = makeCustomLifeAreaRef(BRAIN_DUMP_PRESET_CUSTOM_IDS.personal);
    config.customExamples = {
      [BRAIN_DUMP_PRESET_CUSTOM_IDS.personal]: 'correr, yoga',
    };

    const items = buildOnboardingCaptureItems('Ir a correr 20 min', 'es', config);
    expect(items[0]?.lifeAreaKey).toBe(personalRef);
  });
});
