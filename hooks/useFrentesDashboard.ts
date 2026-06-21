import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Task } from '@/components/tasks/TaskCard';
import {
  buildFrentesDashboard,
  getOpenTasksForFront,
  type FrentesDashboardModel,
} from '@/lib/vnext/buildFrentesDashboard';

type UseFrentesDashboardOptions = {
  userId?: string;
};

export function useFrentesDashboard({ userId }: UseFrentesDashboardOptions) {
  const [loading, setLoading] = useState(Boolean(userId));
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<
    { id: string; name: string; color: string | null; due_date: string | null }[]
  >([]);

  const load = useCallback(async () => {
    if (!userId) {
      setTasks([]);
      setProjects([]);
      setLoading(false);
      return;
    }

    const [projectsRes, tasksRes] = await Promise.all([
      supabase
        .from('projects')
        .select('id, name, color, due_date')
        .eq('user_id', userId)
        .order('name'),
      supabase
        .from('tasks')
        .select(
          'id, content, is_completed, is_priority, category, completed_at, created_at, parent_task_id, project_id, scheduled_date',
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(120),
    ]);

    setProjects(
      (projectsRes.data ?? []).map((project) => ({
        id: project.id,
        name: project.name,
        color: project.color ?? null,
        due_date: project.due_date ?? null,
      })),
    );

    setTasks((tasksRes.data ?? []) as Task[]);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const dashboard = useMemo(
    () => buildFrentesDashboard(tasks, projects),
    [projects, tasks],
  );

  const getFrontTasks = useCallback(
    (frontKey: string) => getOpenTasksForFront(tasks, projects, frontKey),
    [projects, tasks],
  );

  return {
    loading,
    refreshing,
    dashboard,
    projects,
    refresh,
    getFrontTasks,
  };
}
