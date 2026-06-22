import {
  createCustomLifeArea,
  EMPTY_USER_LIFE_AREAS,
  groupProjectsByResolvedLifeArea,
  listActiveLifeAreas,
  parseUserLifeAreasFromPreferences,
  resolveAreasPanelColumnOrder,
  resolveLifeAreaDisplay,
} from '@/lib/lifeAreas/userLifeAreas';
import { makeCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { buildDefaultOnboardingAreaConfig } from '@/lib/review/onboardingAreaSelection';
import { ensureBrainDumpPresetInConfig } from '@/lib/review/brainDumpAreaPreset';

describe('userLifeAreas', () => {
  it('parses custom labels and areas from profile preferences', () => {
    const config = parseUserLifeAreasFromPreferences({
      lifeAreas: {
        labels: { work: 'Mi startup' },
        custom: [{ id: 'abc123', name: 'Side hustle', emoji: '🚀' }],
      },
    });

    expect(config.labels.work).toBe('Mi startup');
    expect(config.custom).toHaveLength(1);
    expect(config.custom[0]?.name).toBe('Side hustle');
  });

  it('groups projects under custom area refs', () => {
    const custom = createCustomLifeArea('Side hustle', '🚀');
    const ref = makeCustomLifeAreaRef(custom.id);
    const config = { labels: {}, custom: [custom] };

    const groups = groupProjectsByResolvedLifeArea(
      [{ id: 'p1', lifeAreaKey: ref }],
      config,
      () => 'Trabajo',
      'Otro',
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.area.name).toBe('Side hustle');
    expect(groups[0]?.projects).toHaveLength(1);
  });

  it('uses renamed built-in labels', () => {
    const area = resolveLifeAreaDisplay('work', { labels: { work: 'Koraa' }, custom: [] });
    expect(area.name).toBe('Koraa');
    expect(area.isCustom).toBe(false);
    expect(area.color).toBeTruthy();
  });

  it('stores custom area color', () => {
    const custom = createCustomLifeArea('Viajes', '✈️', '#14B8A6');
    const area = resolveLifeAreaDisplay(makeCustomLifeAreaRef(custom.id), { labels: {}, custom: [custom] });
    expect(area.color).toBe('#14B8A6');
    expect(area.emoji).toBe('✈️');
  });

  it('resolveAreasPanelColumnOrder keeps other last', () => {
    const config = buildDefaultOnboardingAreaConfig(EMPTY_USER_LIFE_AREAS);
    const order = resolveAreasPanelColumnOrder(config);
    expect(order[order.length - 1]).toBe('other');
    expect(order).not.toContain('health');
  });

  it('listActiveLifeAreas matches panel areas, not full catalog', () => {
    const config = ensureBrainDumpPresetInConfig(EMPTY_USER_LIFE_AREAS);
    const areas = listActiveLifeAreas(config, (key) => key);
    const refs = areas.map((area) => area.ref);

    expect(refs).not.toContain('creative');
    expect(refs).not.toContain('learning');
    expect(refs).not.toContain('health');
    expect(refs[refs.length - 1]).toBe('other');
  });

  it('listActiveLifeAreas can include a legacy ref when editing', () => {
    const config = buildDefaultOnboardingAreaConfig(EMPTY_USER_LIFE_AREAS);
    const areas = listActiveLifeAreas(config, (key) => key, undefined, 'health');
    const refs = areas.map((area) => area.ref);

    expect(refs).toContain('health');
    expect(refs[refs.length - 1]).toBe('other');
    expect(refs.indexOf('health')).toBeLessThan(refs.indexOf('other'));
  });
});
