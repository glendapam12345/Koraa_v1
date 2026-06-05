import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useHoyProjectsMap(userId: string | undefined) {
  const [projectsMap, setProjectsMap] = useState<Record<string, { name: string; color: string }>>({});

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, color')
        .eq('user_id', userId);
      if (!error && data) {
        setProjectsMap(Object.fromEntries(data.map((p) => [p.id, { name: p.name, color: p.color }])));
      }
    })();
  }, [userId]);

  return projectsMap;
}
