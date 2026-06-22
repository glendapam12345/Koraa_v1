import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import type { LifeAreaKey } from '@/lib/lifeAreas/lifeAreaCatalog';
import {
  createCustomLifeArea,
  EMPTY_USER_LIFE_AREAS,
  mergeUserLifeAreasIntoPreferences,
  parseUserLifeAreasFromPreferences,
  type CustomLifeArea,
  type UserLifeAreasConfig,
} from '@/lib/lifeAreas/userLifeAreas';

export function useUserLifeAreas(userId: string | undefined) {
  const [config, setConfig] = useState<UserLifeAreasConfig>(EMPTY_USER_LIFE_AREAS);
  const [loading, setLoading] = useState(Boolean(userId));
  const otherPrefsRef = useRef<Record<string, unknown>>({});

  const load = useCallback(async () => {
    if (!userId) {
      setConfig(EMPTY_USER_LIFE_AREAS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await fetchProfilePreferences(userId);
    otherPrefsRef.current = data?.other_preferences ?? {};
    setConfig(parseUserLifeAreasFromPreferences(otherPrefsRef.current));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = useCallback(
    async (next: UserLifeAreasConfig) => {
      if (!userId) return false;

      const merged = mergeUserLifeAreasIntoPreferences(otherPrefsRef.current, next);
      const { error } = await supabase
        .from('profiles')
        .update({ other_preferences: merged })
        .eq('id', userId);

      if (error) return false;

      otherPrefsRef.current = merged;
      setConfig(next);
      return true;
    },
    [userId],
  );

  const renameBuiltinArea = useCallback(
    async (key: LifeAreaKey, name: string) => {
      const trimmed = name.trim();
      const labels = { ...config.labels };
      if (trimmed) {
        labels[key] = trimmed;
      } else {
        delete labels[key];
      }
      return persist({ ...config, labels });
    },
    [config, persist],
  );

  const addCustomArea = useCallback(
    async (name: string, emoji = '🌿') => {
      const trimmed = name.trim();
      if (!trimmed) return { ok: false as const, entry: null };

      const entry = createCustomLifeArea(trimmed, emoji);
      const ok = await persist({ ...config, custom: [...config.custom, entry] });
      return { ok, entry: ok ? entry : null };
    },
    [config, persist],
  );

  const renameCustomArea = useCallback(
    async (id: string, name: string, emoji?: string) => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      const next: UserLifeAreasConfig = {
        ...config,
        custom: config.custom.map((item) =>
          item.id === id
            ? { ...item, name: trimmed, emoji: emoji ?? item.emoji }
            : item,
        ),
      };
      return persist(next);
    },
    [config, persist],
  );

  const saveConfig = useCallback(
    async (next: UserLifeAreasConfig) => persist(next),
    [persist],
  );

  return {
    config,
    loading,
    reload: load,
    renameBuiltinArea,
    addCustomArea,
    renameCustomArea,
    saveConfig,
  };
}

export type { CustomLifeArea, UserLifeAreasConfig };
