import { useCallback, useEffect, useState } from 'react';
import {
  getAppleHealthConnected,
  isAppleHealthPlatform,
  openAppleHealthSleep,
  setAppleHealthConnected,
} from '@/lib/appleHealth';
import {
  clearSleepCache,
  fetchLastNightSleepFromHealthKit,
  isHealthKitNativeAvailable,
  readCachedLastNightSleep,
  requestHealthKitSleepAccess,
} from '@/lib/appleHealthKit';
import { isShortSleep } from '@/lib/appleHealthSleep';
import type { TranslationKey } from '@/lib/i18n';

type ConnectResult =
  | { ok: true; healthKit: boolean }
  | { ok: false; reason: 'unavailable' | 'open_failed' | 'permission_denied' };

export function useAppleHealthConnection(t: (key: TranslationKey) => string) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastNightHours, setLastNightHours] = useState<number | null>(null);
  const [sleepLoading, setSleepLoading] = useState(false);

  const healthKitAvailable = isHealthKitNativeAvailable();

  const refreshSleep = useCallback(async () => {
    if (!connected) {
      setLastNightHours(null);
      return;
    }

    setSleepLoading(true);
    try {
      if (healthKitAvailable) {
        const summary = await fetchLastNightSleepFromHealthKit();
        setLastNightHours(summary?.hours ?? null);
        return;
      }
      const cached = await readCachedLastNightSleep();
      setLastNightHours(cached);
    } finally {
      setSleepLoading(false);
    }
  }, [connected, healthKitAvailable]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const value = await getAppleHealthConnected();
    setConnected(value);
    setLoading(false);
    if (value) {
      await refreshSleep();
    } else {
      setLastNightHours(null);
    }
  }, [refreshSleep]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connect = useCallback(async (): Promise<ConnectResult> => {
    if (!isAppleHealthPlatform()) {
      return { ok: false, reason: 'unavailable' };
    }

    if (healthKitAvailable) {
      const access = await requestHealthKitSleepAccess();
      if (!access.ok) {
        if (access.reason === 'denied') {
          return { ok: false, reason: 'permission_denied' };
        }
      } else {
        await setAppleHealthConnected(true);
        setConnected(true);
        await refreshSleep();
        await openAppleHealthSleep({ t });
        return { ok: true, healthKit: true };
      }
    }

    const opened = await openAppleHealthSleep({ t });
    if (!opened) {
      return { ok: false, reason: 'open_failed' };
    }

    await setAppleHealthConnected(true);
    setConnected(true);
    return { ok: true, healthKit: false };
  }, [healthKitAvailable, refreshSleep, t]);

  const disconnect = useCallback(async () => {
    await setAppleHealthConnected(false);
    await clearSleepCache();
    setConnected(false);
    setLastNightHours(null);
  }, []);

  const openSleep = useCallback(async () => {
    await openAppleHealthSleep({ t });
  }, [t]);

  return {
    available: isAppleHealthPlatform(),
    healthKitAvailable,
    connected,
    loading,
    lastNightHours,
    shortSleep: lastNightHours != null && isShortSleep(lastNightHours),
    sleepLoading,
    connect,
    disconnect,
    openSleep,
    refresh,
    refreshSleep,
  };
}
