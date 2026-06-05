import { renderHook, waitFor } from '@testing-library/react-native';
import { useHasCheckInToday } from '@/hooks/useHasCheckInToday';
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

function mockCheckInQuery(result: { data: unknown; error: unknown }) {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const eqDate = jest.fn().mockReturnValue({ maybeSingle });
  const eqUser = jest.fn().mockReturnValue({ eq: eqDate });
  const select = jest.fn().mockReturnValue({ eq: eqUser });
  fromMock.mockReturnValue({ select });
}

describe('useHasCheckInToday', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('returns true when check-in exists for today', async () => {
    mockCheckInQuery({ data: { id: 'ci-1' }, error: null });
    const { result } = renderHook(() => useHasCheckInToday('user-1'));

    await waitFor(() => {
      expect(result.current.hasCheckInToday).toBe(true);
    });
  });

  it('returns false when no check-in row', async () => {
    mockCheckInQuery({ data: null, error: null });
    const { result } = renderHook(() => useHasCheckInToday('user-1'));

    await waitFor(() => {
      expect(result.current.hasCheckInToday).toBe(false);
    });
  });

  it('stays null without userId', async () => {
    const { result } = renderHook(() => useHasCheckInToday(undefined));
    expect(result.current.hasCheckInToday).toBe(null);
    expect(fromMock).not.toHaveBeenCalled();
  });
});
