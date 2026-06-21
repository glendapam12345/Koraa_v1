import {
  inferLifeAreaKeyForProject,
  resolveProjectLifeAreaKey,
  groupProjectsByLifeArea,
} from '@/lib/lifeAreas/lifeAreaCatalog';

describe('lifeAreaCatalog', () => {
  it('infers koraa area for Y Combinator style names when ambiguous', () => {
    expect(inferLifeAreaKeyForProject('Koraa App')).toBe('koraa');
    expect(inferLifeAreaKeyForProject('Y Combinator application')).toBe('koraa');
  });

  it('groups projects under life areas', () => {
    const groups = groupProjectsByLifeArea([
      { id: '1', name: 'Y Combinator', lifeAreaKey: 'koraa' },
      { id: '2', name: 'Reels', lifeAreaKey: 'impermanence' },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.area.key).toBe('koraa');
    expect(groups[0]?.projects[0]?.name).toBe('Y Combinator');
  });

  it('resolves stored key over inference', () => {
    expect(resolveProjectLifeAreaKey('personal', 'Y Combinator')).toBe('personal');
  });
});
