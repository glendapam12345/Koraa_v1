import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';
import { HOY_TAB_PATH } from '@/lib/hoyTabPath';

jest.mock('expo-router', () => ({
  router: {
    navigate: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

describe('checkInNavigation', () => {
  it('does not use `/`, which remounts the boot screen', () => {
    expect(CHECK_IN_ROUTE).not.toBe('/');
    expect(String(CHECK_IN_ROUTE)).toBe(HOY_TAB_PATH);
  });
});
