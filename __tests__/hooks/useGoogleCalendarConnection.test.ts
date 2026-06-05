import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useGoogleCalendarConnection } from '@/hooks/useGoogleCalendarConnection';
import * as googleCalendar from '@/lib/googleCalendar';

jest.mock('@/lib/googleCalendar', () => ({
  isGoogleCalendarConfigured: jest.fn(() => true),
  getGoogleCalendarConnectionInfo: jest.fn(),
  connectGoogleCalendar: jest.fn(),
  disconnectGoogleCalendar: jest.fn(),
}));

const configuredMock = googleCalendar.isGoogleCalendarConfigured as jest.Mock;
const infoMock = googleCalendar.getGoogleCalendarConnectionInfo as jest.Mock;
const connectMock = googleCalendar.connectGoogleCalendar as jest.Mock;
const disconnectMock = googleCalendar.disconnectGoogleCalendar as jest.Mock;

describe('useGoogleCalendarConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configuredMock.mockReturnValue(true);
    infoMock.mockResolvedValue({ connected: false });
  });

  it('loads disconnected state for a user', async () => {
    const { result } = renderHook(() => useGoogleCalendarConnection('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.configured).toBe(true);
    expect(result.current.connected).toBe(false);
    expect(infoMock).toHaveBeenCalledWith('user-1');
  });

  it('connect delegates to googleCalendar and refreshes', async () => {
    infoMock
      .mockResolvedValueOnce({ connected: false })
      .mockResolvedValueOnce({ connected: true, email: 'a@b.com' });
    connectMock.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useGoogleCalendarConnection('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const res = await result.current.connect();
      expect(res).toEqual({ ok: true });
    });

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
      expect(result.current.email).toBe('a@b.com');
    });
    expect(connectMock).toHaveBeenCalledWith('user-1');
  });

  it('disconnect clears connection', async () => {
    infoMock
      .mockResolvedValueOnce({ connected: true, email: 'a@b.com' })
      .mockResolvedValueOnce({ connected: false });
    disconnectMock.mockResolvedValue(undefined);

    const { result } = renderHook(() => useGoogleCalendarConnection('user-1'));
    await waitFor(() => expect(result.current.connected).toBe(true));

    await act(async () => {
      await result.current.disconnect();
    });

    await waitFor(() => {
      expect(result.current.connected).toBe(false);
    });
    expect(disconnectMock).toHaveBeenCalledWith('user-1');
  });
});
