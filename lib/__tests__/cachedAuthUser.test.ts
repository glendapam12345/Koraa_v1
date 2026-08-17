import {
  peekCachedAuthUser,
  resetCachedAuthUser,
  setCachedAuthUser,
} from '@/lib/cachedAuthUser';

describe('cachedAuthUser', () => {
  afterEach(() => {
    resetCachedAuthUser();
  });

  it('starts unset so callers can fall back to getSession', () => {
    expect(peekCachedAuthUser()).toBeUndefined();
  });

  it('remembers the signed-in user without another storage read', () => {
    setCachedAuthUser({ id: 'user-1' });
    expect(peekCachedAuthUser()).toEqual({ id: 'user-1' });
  });

  it('treats null as signed out, not unset', () => {
    setCachedAuthUser(null);
    expect(peekCachedAuthUser()).toBeNull();
  });
});
