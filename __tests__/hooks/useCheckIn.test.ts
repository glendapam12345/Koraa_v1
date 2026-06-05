import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCheckIn } from '@/hooks/useCheckIn';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
  getErrorMessage: jest.fn(() => 'Error de red'),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn() },
}));

const getUserMock = supabase.auth.getUser as jest.Mock;
const fromMock = supabase.from as jest.Mock;

function mockTodayCheckIn(result: { data: unknown; error: unknown }) {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const eqDate = jest.fn().mockReturnValue({ maybeSingle });
  const eqUser = jest.fn().mockReturnValue({ eq: eqDate });
  const select = jest.fn().mockReturnValue({ eq: eqUser });
  fromMock.mockReturnValue({ select });
}

describe('useCheckIn', () => {
  const showToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('loads today mood and energy from check-in row', async () => {
    mockTodayCheckIn({
      data: {
        emotion: 'Tranquila',
        energy_level: 4,
        available_time: '2h',
        focus_level: 'alto',
      },
      error: null,
    });

    const { result } = renderHook(() => useCheckIn(showToast));

    await act(async () => {
      await result.current.loadTodayCheckIn();
    });

    expect(result.current.todayMood).toBe('Tranquila');
    expect(result.current.energyLevel).toBe(4);
    expect(result.current.time).toBe('2h');
    expect(result.current.focusLevel).toBe('alto');
    expect(result.current.loading).toBe(false);
  });

  it('clears state when no check-in today', async () => {
    mockTodayCheckIn({ data: null, error: null });

    const { result } = renderHook(() => useCheckIn(showToast));

    await act(async () => {
      await result.current.loadTodayCheckIn();
    });

    expect(result.current.todayMood).toBeNull();
    expect(result.current.energyLevel).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it('shows toast on query error', async () => {
    mockTodayCheckIn({ data: null, error: { message: 'fail' } });

    const { result } = renderHook(() => useCheckIn(showToast));

    await act(async () => {
      await result.current.loadTodayCheckIn();
    });

    expect(showToast).toHaveBeenCalledWith('Error de red', 'error');
    expect(result.current.todayMood).toBeNull();
  });
});
