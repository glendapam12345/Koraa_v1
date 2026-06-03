import {
  isSupabaseHealthDevDetail,
  shouldShowSupabaseHealthBanner,
} from '@/lib/supabaseHealthBannerMode';

describe('supabaseHealthBannerMode', () => {
  const originalDev = (global as { __DEV__?: boolean }).__DEV__;

  afterEach(() => {
    (global as { __DEV__?: boolean }).__DEV__ = originalDev;
  });

  it('isSupabaseHealthDevDetail follows __DEV__', () => {
    (global as { __DEV__?: boolean }).__DEV__ = true;
    expect(isSupabaseHealthDevDetail()).toBe(true);
    (global as { __DEV__?: boolean }).__DEV__ = false;
    expect(isSupabaseHealthDevDetail()).toBe(false);
  });

  it('never shows banner for idle, checking, or ok', () => {
    (global as { __DEV__?: boolean }).__DEV__ = false;
    expect(shouldShowSupabaseHealthBanner('idle')).toBe(false);
    expect(shouldShowSupabaseHealthBanner('checking')).toBe(false);
    expect(shouldShowSupabaseHealthBanner('ok')).toBe(false);
  });

  it('in production hides dev-only config statuses', () => {
    (global as { __DEV__?: boolean }).__DEV__ = false;
    expect(shouldShowSupabaseHealthBanner('missing_config')).toBe(false);
    expect(shouldShowSupabaseHealthBanner('config_mismatch')).toBe(false);
  });

  it('in production shows user-actionable sync issues', () => {
    (global as { __DEV__?: boolean }).__DEV__ = false;
    expect(shouldShowSupabaseHealthBanner('unreachable')).toBe(true);
    expect(shouldShowSupabaseHealthBanner('schema_incomplete')).toBe(true);
  });

  it('in development shows all error statuses', () => {
    (global as { __DEV__?: boolean }).__DEV__ = true;
    expect(shouldShowSupabaseHealthBanner('missing_config')).toBe(true);
    expect(shouldShowSupabaseHealthBanner('config_mismatch')).toBe(true);
    expect(shouldShowSupabaseHealthBanner('schema_incomplete')).toBe(true);
  });
});
