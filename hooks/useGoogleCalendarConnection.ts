import { useCallback, useEffect, useState } from 'react';
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getGoogleCalendarConnectionInfo,
  isGoogleCalendarConfigured,
} from '@/lib/googleCalendar';

type ConnectionState = {
  configured: boolean;
  connected: boolean;
  email?: string;
  loading: boolean;
};

export function useGoogleCalendarConnection(userId: string | undefined) {
  const [state, setState] = useState<ConnectionState>({
    configured: isGoogleCalendarConfigured(),
    connected: false,
    loading: Boolean(userId),
  });

  const refresh = useCallback(async () => {
    if (!userId) {
      setState({
        configured: isGoogleCalendarConfigured(),
        connected: false,
        loading: false,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));
    const info = await getGoogleCalendarConnectionInfo(userId);
    setState({
      configured: isGoogleCalendarConfigured(),
      connected: info.connected,
      email: info.email,
      loading: false,
    });
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connect = useCallback(async () => {
    if (!userId) {
      return { ok: false as const, reason: 'not_configured' as const };
    }
    setState((prev) => ({ ...prev, loading: true }));
    const result = await connectGoogleCalendar(userId);
    await refresh();
    return result;
  }, [refresh, userId]);

  const disconnect = useCallback(async () => {
    if (!userId) return;
    setState((prev) => ({ ...prev, loading: true }));
    await disconnectGoogleCalendar(userId);
    await refresh();
  }, [refresh, userId]);

  return {
    ...state,
    refresh,
    connect,
    disconnect,
  };
}
