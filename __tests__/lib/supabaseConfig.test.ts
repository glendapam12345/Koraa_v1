(globalThis as { __DEV__?: boolean }).__DEV__ = true;

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        supabaseUrl: 'https://extra.example.supabase.co',
        supabaseAnonKey: 'extra-key',
      },
    },
    manifest: null,
    manifest2: null,
  },
}));

import {
  getSupabaseConfigMismatch,
  isSupabaseConfiguredFromConfig,
  resolveSupabaseConfig,
} from '@/lib/supabaseConfig';

describe('resolveSupabaseConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('reads from expo extra when env vars are missing', () => {
    const config = resolveSupabaseConfig();
    expect(config.source).toBe('extra');
    expect(config.host).toBe('extra.example.supabase.co');
    expect(isSupabaseConfiguredFromConfig(config)).toBe(true);
  });

  it('prefers EXPO_PUBLIC_* over extra', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://env.example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'env-key';
    const config = resolveSupabaseConfig();
    expect(config.source).toBe('env');
    expect(config.url).toContain('env.example');
  });
});

describe('getSupabaseConfigMismatch', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('detects different hosts between env and extra in dev', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://aaa.supabase.co';
    const mismatch = getSupabaseConfigMismatch();
    expect(mismatch?.mismatched).toBe(true);
    expect(mismatch?.envHost).toBe('aaa.supabase.co');
    expect(mismatch?.extraHost).toBe('extra.example.supabase.co');
  });
});
