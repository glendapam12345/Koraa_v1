import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dateLocal';

export type ProjectLibraryItem = {
  id: string;
  name: string;
  color: string;
  dueDate: string | null;
  taskCount: number;
  incompleteCount: number;
  withDateCount: number;
};

export function useProjectsLibrary(userId: string | undefined) {
  const [projects, setProjects] = useState<ProjectLibraryItem[]>([]);
  const [looseCount, setLooseCount] = useState(0);
  const [totalIncomplete, setTotalIncomplete] = useState(0);
  const [focusIncomplete, setFocusIncomplete] = useState(0);
  const [hasCheckInToday, setHasCheckInToday] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setProjects([]);
      setLooseCount(0);
      setTotalIncomplete(0);
      setFocusIncomplete(0);
      setHasCheckInToday(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const today = getLocalDateString();
      const { data: checkInData } = await supabase
        .from('daily_check_ins')
        .select('id')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();
      setHasCheckInToday(!!checkInData);

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, color, due_date')
        .eq('user_id', userId)
        .order('priority', { ascending: false });

      if (projectsError) {
        setProjects([]);
        return;
      }

      const list = (projectsData || []) as {
        id: string;
        name: string;
        color: string;
        due_date?: string | null;
      }[];
      const byProject: Record<string, { total: number; incomplete: number; withDate: number }> = {};
      for (const p of list) {
        byProject[p.id] = { total: 0, incomplete: 0, withDate: 0 };
      }

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('project_id, is_completed, scheduled_date, is_priority')
        .eq('user_id', userId)
        .is('parent_task_id', null);

      let loose = 0;
      let totalInc = 0;
      let focusInc = 0;
      if (!tasksError && tasksData) {
        for (const task of tasksData) {
          const pid = task.project_id as string | null;
          if (!task.is_completed) {
            totalInc += 1;
            if (task.is_priority) focusInc += 1;
          }
          if (pid == null) {
            if (!task.is_completed) loose += 1;
            continue;
          }
          if (!byProject[pid]) continue;
          byProject[pid].total += 1;
          if (!task.is_completed) byProject[pid].incomplete += 1;
          if (task.scheduled_date) byProject[pid].withDate += 1;
        }
      }
      setLooseCount(loose);
      setTotalIncomplete(totalInc);
      setFocusIncomplete(focusInc);

      setProjects(
        list.map((p) => ({
          id: p.id,
          name: p.name,
          color: p.color,
          dueDate: p.due_date ?? null,
          taskCount: byProject[p.id]?.total ?? 0,
          incompleteCount: byProject[p.id]?.incomplete ?? 0,
          withDateCount: byProject[p.id]?.withDate ?? 0,
        })),
      );
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  return {
    projects,
    looseCount,
    totalIncomplete,
    focusIncomplete,
    hasCheckInToday,
    loading,
    refreshing,
    refresh,
    reload: load,
  };
}
