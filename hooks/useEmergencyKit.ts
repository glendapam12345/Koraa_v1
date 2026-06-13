import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { buildEmergencyKitContext } from '@/lib/emergencyKit/buildContext';
import { fetchEmergencyKitSession } from '@/lib/emergencyKit/emergencyKitAi';
import {
  addComfortItem,
  loadComfortItems,
  loadLastSession,
  removeComfortItem,
  saveLastSession,
  setCrisisMode,
} from '@/lib/emergencyKit/storage';
import { scheduleActiveReminders } from '@/hooks/useNotifications';
import type {
  ComfortItem,
  EmergencyKitAiResponse,
  EmergencyKitEventId,
  EmergencyKitSessionState,
  NewComfortItem,
} from '@/lib/emergencyKit/types';

export function useEmergencyKit() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const [items, setItems] = useState<ComfortItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [lastSession, setLastSession] = useState<EmergencyKitSessionState | null>(null);

  const refreshItems = useCallback(async () => {
    setLoadingItems(true);
    const loaded = await loadComfortItems();
    setItems(loaded);
    setLoadingItems(false);
  }, []);

  useEffect(() => {
    void refreshItems();
    void loadLastSession().then(setLastSession);
  }, [refreshItems]);

  const startSession = useCallback(
    async (
      eventId: EmergencyKitEventId,
      customText?: string
    ): Promise<EmergencyKitSessionState | null> => {
      if (!user?.id) return null;
      setSessionLoading(true);
      try {
        const context = await buildEmergencyKitContext(
          user.id,
          eventId,
          customText,
          locale === 'en' ? 'en' : 'es'
        );
        const currentItems = await loadComfortItems();
        const savedIds = currentItems.map((i) => i.id);
        const response: EmergencyKitAiResponse = await fetchEmergencyKitSession(
          context,
          savedIds
        );
        await setCrisisMode(response.crisisMode);
        void scheduleActiveReminders(locale === 'en' ? 'en' : 'es');
        const session: EmergencyKitSessionState = {
          eventId,
          customText,
          response,
          openedAt: new Date().toISOString(),
        };
        await saveLastSession(session);
        setLastSession(session);
        return session;
      } finally {
        setSessionLoading(false);
      }
    },
    [user?.id, locale]
  );

  const addItem = useCallback(
    async (item: NewComfortItem) => {
      const created = await addComfortItem(item);
      setItems((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const deleteItem = useCallback(async (id: string) => {
    await removeComfortItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return {
    items,
    loadingItems,
    sessionLoading,
    lastSession,
    refreshItems,
    startSession,
    addItem,
    deleteItem,
  };
}
