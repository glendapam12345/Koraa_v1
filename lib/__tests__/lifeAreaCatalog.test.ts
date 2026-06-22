import {
  inferLifeAreaKeyForProject,
  resolveProjectLifeAreaKey,
  groupProjectsByLifeArea,
} from '@/lib/lifeAreas/lifeAreaCatalog';

describe('lifeAreaCatalog', () => {
  it('infers generic work area for app-style names', () => {
    expect(inferLifeAreaKeyForProject('Mobile App launch')).toBe('work');
    expect(inferLifeAreaKeyForProject('Y Combinator application')).toBe('work');
  });

  it('maps legacy stored keys to generic areas', () => {
    expect(resolveProjectLifeAreaKey('koraa', 'Anything')).toBe('work');
    expect(resolveProjectLifeAreaKey('impermanence', 'Brand')).toBe('creative');
    expect(resolveProjectLifeAreaKey('personal', 'Home stuff')).toBe('home');
  });

  it('groups projects under life areas', () => {
    const groups = groupProjectsByLifeArea([
      { id: '1', name: 'Y Combinator', lifeAreaKey: 'work' },
      { id: '2', name: 'Reels', lifeAreaKey: 'creative' },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.area.key).toBe('work');
    expect(groups[0]?.projects[0]?.name).toBe('Y Combinator');
  });

  it('resolves stored key over inference', () => {
    expect(resolveProjectLifeAreaKey('home', 'Y Combinator')).toBe('home');
  });
});
