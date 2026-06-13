import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  clearCrisisMode,
  isCrisisModeActive,
  loadLastSession,
  setCrisisMode,
} from '@/lib/emergencyKit/storage';
import { scheduleActiveReminders } from '@/hooks/useNotifications';
import type { EmergencyKitSessionState } from '@/lib/emergencyKit/types';

export function useCrisisMode() {
  const [active, setActive] = useState(false);
  const [lastSession, setLastSession] = useState<EmergencyKitSessionState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [crisis, session] = await Promise.all([isCrisisModeActive(), loadLastSession()]);
    setActive(crisis);
    setLastSession(session);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const dismiss = useCallback(async () => {
    await clearCrisisMode();
    setActive(false);
    void scheduleActiveReminders();
  }, []);

  const activate = useCallback(async () => {
    await setCrisisMode(true);
    setActive(true);
    void scheduleActiveReminders();
  }, []);

  return {
    crisisModeActive: active,
    lastSession,
    loading,
    refresh,
    dismissCrisisMode: dismiss,
    activateCrisisMode: activate,
  };
}
