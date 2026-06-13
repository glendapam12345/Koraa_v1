import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getFocusedProjectId, setFocusedProjectId } from '@/lib/focusedProjectStorage';

export type FocusedProjectInfo = {
  id: string;
  name: string;
  color: string;
};

export function useFocusedProject(userId: string | undefined) {
  const [focusedProject, setFocusedProject] = useState<FocusedProjectInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setFocusedProject(null);
      return;
    }
    setLoading(true);
    try {
      const projectId = await getFocusedProjectId(userId);
      if (!projectId) {
        setFocusedProject(null);
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('name, color')
        .eq('id', projectId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        await setFocusedProjectId(userId, null);
        setFocusedProject(null);
        return;
      }

      setFocusedProject({
        id: projectId,
        name: data.name,
        color: data.color ?? '#4A90D9',
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const clearFocus = useCallback(async () => {
    if (!userId) return;
    await setFocusedProjectId(userId, null);
    setFocusedProject(null);
  }, [userId]);

  return { focusedProject, loading, refresh, clearFocus };
}
