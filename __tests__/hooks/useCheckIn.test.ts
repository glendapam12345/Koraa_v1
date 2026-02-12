import { renderHook, waitFor } from '@testing-library/react-native';
import { useCheckIn } from '@/hooks/useCheckIn';
import { supabase } from '@/lib/supabase';

// Mock de Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
  getErrorMessage: jest.fn((error) => error?.message || 'Error desconocido'),
}));

describe('useCheckIn', () => {
  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty values', () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useCheckIn(mockShowToast));

    expect(result.current.todayMood).toBe('');
    expect(result.current.energy).toBe('');
    expect(result.current.energyLevel).toBe(0);
    expect(result.current.time).toBe('');
    expect(result.current.focusLevel).toBe('');
    expect(result.current.loading).toBe(true);
  });

  it('should load check-in data successfully', async () => {
    const mockUser = { id: 'user-123' };
    const mockCheckIn = {
      emotion: 'tranquila',
      energy_level: 4,
      available_time: 'Medio (2-4hrs)',
      focus_level: 'Enfocada',
    };

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockCheckIn,
              error: null,
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useCheckIn(mockShowToast));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.todayMood).toBe('tranquila');
    expect(result.current.energy).toBe('4/5');
    expect(result.current.energyLevel).toBe(4);
    expect(result.current.time).toBe('Medio (2-4hrs)');
    expect(result.current.focusLevel).toBe('Enfocada');
  });

  it('should handle no check-in gracefully', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useCheckIn(mockShowToast));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.todayMood).toBe('');
    expect(result.current.energy).toBe('');
    expect(result.current.energyLevel).toBe(0);
    expect(result.current.time).toBe('');
    expect(result.current.focusLevel).toBe('');
  });

  it('should handle errors and show toast', async () => {
    const mockError = { message: 'Database error' };

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useCheckIn(mockShowToast));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockShowToast).toHaveBeenCalledWith('Database error', 'error');
  });

  it('should handle no user', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
    });

    const { result } = renderHook(() => useCheckIn(mockShowToast));

    // Debería mantener valores iniciales
    expect(result.current.todayMood).toBe('');
    expect(result.current.energy).toBe('');
  });
});
