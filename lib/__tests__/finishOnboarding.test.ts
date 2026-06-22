import { resolvePaywallDismissRoute } from '@/lib/paywallNavigation';

describe('resolvePaywallDismissRoute', () => {
  it('always replaces on onboarding paywall (never back)', () => {
    expect(
      resolvePaywallDismissRoute({
        next: '/(tabs)',
        source: 'onboarding',
        canGoBack: true,
      }),
    ).toBe('/(tabs)');
  });

  it('uses back when not onboarding and stack allows it', () => {
    expect(
      resolvePaywallDismissRoute({
        next: '/settings',
        source: 'default',
        canGoBack: true,
      }),
    ).toBe('back');
  });

  it('falls back to tabs when cannot go back', () => {
    expect(
      resolvePaywallDismissRoute({
        canGoBack: false,
      }),
    ).toBe('/(tabs)');
  });
});
