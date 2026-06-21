import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchUserProjects } from '@/lib/projectDueDateSchema';
import { getLocalDateString } from '@/lib/dateLocal';

import {
  resolveProjectLifeAreaKey,
  type LifeAreaKey,
} from '@/lib/lifeAreas/lifeAreaCatalog';

export type ProjectLibraryItem = {
  id: string;
  name: string;
  color: string;
  dueDate: string | null;
  lifeAreaKey: LifeAreaKey;
  priority: number;
  taskCount: number;
  incompleteCount: number;
  withDateCount: number;
};

type UseProjectsLibraryOptions = {
  /** Si el padre ya conoce el check-in de hoy, evita una query extra. */
  hasCheckInToday?: boolean | null;
};

type LoadOptions = {
  silent?: boolean;
};

export function useProjectsLibrary(userId: string | undefined, options?: UseProjectsLibraryOptions) {
  const externalCheckIn = options?.hasCheckInToday;
  const [projects, setProjects] = useState<ProjectLibraryItem[]>([]);
  const [looseCount, setLooseCount] = useState(0);
  const [totalIncomplete, setTotalIncomplete] = useState(0);
  const [focusIncomplete, setFocusIncomplete] = useState(0);
  const [hasCheckInToday, setHasCheckInToday] = useState<boolean | null>(
    externalCheckIn ?? null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);

  const load = useCallback(
    async (loadOptions?: LoadOptions) => {
      if (!userId) {
        setProjects([]);
        setLooseCount(0);
        setTotalIncomplete(0);
        setFocusIncomplete(0);
        setHasCheckInToday(externalCheckIn ?? null);
        setLoading(false);
        setRefreshing(false);
        hasLoadedRef.current = false;
        return;
      }

      const silent = Boolean(loadOptions?.silent && hasLoadedRef.current);
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const today = getLocalDateString();
        const skipCheckInQuery = externalCheckIn !== undefined && externalCheckIn !== null;

        const checkInPromise = skipCheckInQuery
          ? Promise.resolve({ data: externalCheckIn ? { id: 'cached' } : null, error: null })
          : supabase
              .from('daily_check_ins')
              .select('id')
              .eq('user_id', userId)
              .eq('date', today)
              .maybeSingle();

        const [checkInRes, projectsRes, tasksRes] = await Promise.all([
          checkInPromise,
          fetchUserProjects(userId),
          supabase
            .from('tasks')
            .select('project_id, is_completed, scheduled_date, is_priority')
            .eq('user_id', userId)
            .is('parent_task_id', null),
        ]);

        if (!skipCheckInQuery) {
          setHasCheckInToday(!!checkInRes.data);
        } else {
          setHasCheckInToday(externalCheckIn ?? null);
        }

        const { data: projectsData, error: projectsError } = projectsRes;
        if (projectsError) {
          if (!silent) setProjects([]);
          return;
        }

        const list = projectsData;
        const byProject: Record<string, { total: number; incomplete: number; withDate: number }> = {};
        for (const p of list) {
          byProject[p.id] = { total: 0, incomplete: 0, withDate: 0 };
        }

        const { data: tasksData, error: tasksError } = tasksRes;

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
            lifeAreaKey: resolveProjectLifeAreaKey(p.life_area_key, p.name),
            priority: typeof p.priority === 'number' ? p.priority : 5,
            taskCount: byProject[p.id]?.total ?? 0,
            incompleteCount: byProject[p.id]?.incomplete ?? 0,
            withDateCount: byProject[p.id]?.withDate ?? 0,
          })),
        );
        hasLoadedRef.current = true;
      } catch {
        if (!silent) setProjects([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [externalCheckIn, userId],
  );

  useEffect(() => {
    hasLoadedRef.current = false;
    void load();
  }, [load]);

  useEffect(() => {
    if (externalCheckIn !== undefined && externalCheckIn !== null) {
      setHasCheckInToday(externalCheckIn);
    }
  }, [externalCheckIn]);

  const refresh = useCallback(() => {
    void load({ silent: true });
  }, [load]);

  const reload = useCallback(
    (silent = false) => {
      void load({ silent });
    },
    [load],
  );

  return {
    projects,
    looseCount,
    totalIncomplete,
    focusIncomplete,
    hasCheckInToday,
    loading,
    refreshing,
    refresh,
    reload,
  };
}
