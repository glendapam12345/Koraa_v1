import { renderHook, act } from '@testing-library/react-native';
import { useCheckIn } from '@/hooks/useCheckIn';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dateLocal';

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

jest.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (key: string) => key, locale: 'es' }),
}));

const getUserMock = supabase.auth.getUser as jest.Mock;
const fromMock = supabase.from as jest.Mock;

function mockRecentCheckIns(result: { data: unknown; error: unknown }) {
  const limit = jest.fn().mockResolvedValue(result);
  const order = jest.fn().mockReturnValue({ limit });
  const lte = jest.fn().mockReturnValue({ order });
  const eqUser = jest.fn().mockReturnValue({ lte });
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
    const today = getLocalDateString();
    mockRecentCheckIns({
      data: [
        {
          date: today,
          emotion: 'Tranquila',
          energy_level: 4,
          available_time: '2h',
          focus_level: 'alto',
        },
      ],
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

  it('clears today and keeps yesterday memory when there is no check-in today', async () => {
    mockRecentCheckIns({
      data: [{ date: '2020-01-01', emotion: 'agotada', energy_level: 1 }],
      error: null,
    });

    const { result } = renderHook(() => useCheckIn(showToast));

    await act(async () => {
      await result.current.loadTodayCheckIn();
    });

    expect(result.current.todayMood).toBeNull();
    expect(result.current.energyLevel).toBe(0);
    expect(result.current.returnMemory).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('shows toast on query error', async () => {
    mockRecentCheckIns({ data: null, error: { message: 'fail' } });

    const { result } = renderHook(() => useCheckIn(showToast));

    await act(async () => {
      await result.current.loadTodayCheckIn();
    });

    expect(showToast).toHaveBeenCalledWith('Error de red', 'error');
    expect(result.current.todayMood).toBeNull();
    expect(result.current.returnMemory).toBeNull();
  });
});
