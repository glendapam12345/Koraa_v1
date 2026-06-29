import {
  hasCompletedOnboarding,
  markOnboardingCompletedIfNeeded,
  resolvePostAuthGate,
  WELCOME_ROUTE,
} from '@/lib/onboardingGate';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn() },
}));

const fromMock = supabase.from as jest.Mock;

function mockProfileQuery(result: { data: unknown; error: unknown }) {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  fromMock.mockReturnValue({ select });
}

describe('resolvePostAuthGate', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('returns tabs when onboarding is completed', async () => {
    mockProfileQuery({ data: { onboarding_completed: true }, error: null });
    const result = await resolvePostAuthGate('uid');
    expect(result).toEqual({ status: 'ok', route: '/(tabs)' });
  });

  it('returns welcome when profile row is missing', async () => {
    mockProfileQuery({ data: null, error: null });
    const result = await resolvePostAuthGate('uid');
    expect(result).toEqual({ status: 'ok', route: WELCOME_ROUTE });
  });

  it('returns error when profile read fails', async () => {
    mockProfileQuery({ data: null, error: { message: 'network' } });
    const result = await resolvePostAuthGate('uid');
    expect(result).toEqual({ status: 'error', reason: 'profile_read_failed' });
  });
});

describe('hasCompletedOnboarding', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('returns true when onboarding is completed', async () => {
    mockProfileQuery({ data: { onboarding_completed: true }, error: null });
    await expect(hasCompletedOnboarding('uid')).resolves.toBe(true);
  });

  it('returns false when onboarding is not completed', async () => {
    mockProfileQuery({ data: { onboarding_completed: false }, error: null });
    await expect(hasCompletedOnboarding('uid')).resolves.toBe(false);
  });

  it('returns null when profile read fails', async () => {
    mockProfileQuery({ data: null, error: { message: 'network' } });
    await expect(hasCompletedOnboarding('uid')).resolves.toBeNull();
  });
});

describe('markOnboardingCompletedIfNeeded', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('skips update when onboarding already completed', async () => {
    mockProfileQuery({ data: { onboarding_completed: true }, error: null });
    const result = await markOnboardingCompletedIfNeeded('uid');
    expect(result).toEqual({ error: null, newlyCompleted: false });
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it('marks profile when onboarding is pending', async () => {
    const maybeSingleRead = jest
      .fn()
      .mockResolvedValue({ data: { onboarding_completed: false }, error: null });
    const eqRead = jest.fn().mockReturnValue({ maybeSingle: maybeSingleRead });
    const selectRead = jest.fn().mockReturnValue({ eq: eqRead });

    const eqUpdate = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn().mockReturnValue({ eq: eqUpdate });

    fromMock.mockReturnValueOnce({ select: selectRead }).mockReturnValueOnce({ update });

    const result = await markOnboardingCompletedIfNeeded('uid');
    expect(result).toEqual({ error: null, newlyCompleted: true });
    expect(update).toHaveBeenCalledWith({ onboarding_completed: true });
  });
});