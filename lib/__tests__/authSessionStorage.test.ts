import {
  pickAuthSessionStoredValue,
  shouldStoreAuthSessionInAsyncStorage,
} from '@/lib/authSessionStoragePolicy';

describe('authSessionStorage', () => {
  it('keeps tiny values in SecureStore', () => {
    expect(shouldStoreAuthSessionInAsyncStorage('short')).toBe(false);
  });

  it('moves a Supabase-sized session out of SecureStore', () => {
    expect(shouldStoreAuthSessionInAsyncStorage('x'.repeat(2049))).toBe(true);
  });

  it('prefers the longer stored session so a truncated keychain copy cannot win', () => {
    expect(pickAuthSessionStoredValue('tiny', '{"access_token":"full"}')).toBe(
      '{"access_token":"full"}',
    );
  });

  it('ignores truncated JSON from SecureStore instead of handing it to auth', () => {
    expect(pickAuthSessionStoredValue('{"access_token":"cut-off', null)).toBeNull();
  });
});
