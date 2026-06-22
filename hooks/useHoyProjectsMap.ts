import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useHoyProjectsMap(userId: string | undefined) {
  const [projectsMap, setProjectsMap] = useState<
    Record<string, { name: string; color: string; due_date?: string | null; life_area_key?: string | null }>
  >({});

  const reloadProjects = useCallback(async () => {
    if (!userId) {
      setProjectsMap({});
      return;
    }
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, color, due_date, life_area_key')
      .eq('user_id', userId);
    if (!error && data) {
      setProjectsMap(
        Object.fromEntries(
          data.map((p) => [
            p.id,
            {
              name: p.name,
              color: p.color,
              due_date: p.due_date ?? null,
              life_area_key: p.life_area_key ?? null,
            },
          ]),
        ),
      );
    }
  }, [userId]);

  useEffect(() => {
    void reloadProjects();
  }, [reloadProjects]);

  return { projectsMap, reloadProjects };
}
