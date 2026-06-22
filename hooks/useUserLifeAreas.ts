import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchProfilePreferences } from '@/lib/profilePreferences';
import type { LifeAreaKey, LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { makeCustomLifeAreaRef, isCustomLifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { canDeleteCustomAreaId } from '@/lib/lifeAreas/userLifeAreas';
import {
  createCustomLifeArea,
  EMPTY_USER_LIFE_AREAS,
  mergeUserLifeAreasIntoPreferences,
  parseUserLifeAreasFromPreferences,
  type CustomLifeArea,
  removeCustomAreaFromConfig,
  removeAreaFromUserConfig,
  reorderAreaColumnInConfig,
  type UserLifeAreasConfig,
} from '@/lib/lifeAreas/userLifeAreas';

export function useUserLifeAreas(userId: string | undefined) {
  const [config, setConfig] = useState<UserLifeAreasConfig>(EMPTY_USER_LIFE_AREAS);
  const [loading, setLoading] = useState(Boolean(userId));
  const otherPrefsRef = useRef<Record<string, unknown>>({});
  const configRef = useRef(config);

  configRef.current = config;

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
    async (name: string, emoji = '🌿', color?: string) => {
      const trimmed = name.trim();
      if (!trimmed) return { ok: false as const, entry: null };

      const entry = createCustomLifeArea(trimmed, emoji, color);
      const ok = await persist({ ...config, custom: [...config.custom, entry] });
      return { ok, entry: ok ? entry : null };
    },
    [config, persist],
  );

  const renameCustomArea = useCallback(
    async (id: string, name: string, emoji?: string, color?: string) => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      const next: UserLifeAreasConfig = {
        ...config,
        custom: config.custom.map((item) =>
          item.id === id
            ? {
                ...item,
                name: trimmed,
                emoji: emoji ?? item.emoji,
                color: color ?? item.color,
              }
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

  const reorderAreaColumn = useCallback(
    async (ref: LifeAreaRef, direction: 'up' | 'down') => {
      const next = reorderAreaColumnInConfig(config, ref, direction);
      if (next === config) return false;
      return persist(next);
    },
    [config, persist],
  );

  const removeArea = useCallback(
    async (ref: LifeAreaRef) => {
      const current = configRef.current;
      const customId = isCustomLifeAreaRef(ref) ? ref.slice('custom:'.length) : null;
      const next = removeAreaFromUserConfig(current, ref);
      const ok = await persist(next);
      if (!ok) return false;

      if (userId && customId && canDeleteCustomAreaId(customId)) {
        await supabase
          .from('tasks')
          .update({ life_area_key: null })
          .eq('user_id', userId)
          .eq('life_area_key', ref);
      }

      return true;
    },
    [persist, userId],
  );

  const removeCustomArea = useCallback(
    async (id: string) => removeArea(makeCustomLifeAreaRef(id)),
    [removeArea],
  );

  return {
    config,
    loading,
    reload: load,
    renameBuiltinArea,
    addCustomArea,
    renameCustomArea,
    removeCustomArea,
    removeArea,
    saveConfig,
    reorderAreaColumn,
  };
}

export type { CustomLifeArea, UserLifeAreasConfig };
