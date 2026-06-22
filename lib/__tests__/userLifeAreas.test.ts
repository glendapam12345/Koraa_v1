import {
  createCustomLifeArea,
  groupProjectsByResolvedLifeArea,
  parseUserLifeAreasFromPreferences,
  resolveLifeAreaDisplay,
} from '@/lib/lifeAreas/userLifeAreas';
import { makeCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';

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
  });
});
