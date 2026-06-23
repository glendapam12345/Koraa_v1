import { useEffect, useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Task } from '@/components/tasks/TaskCard';
import { buildProjectProgressMap, type ProjectProgressMap } from '@/lib/hoy/focusTaskDisplay';
import {
  loadTaskPlanningMetaMap,
  type TaskPlanningMeta,
} from '@/lib/taskPlanningMeta';

export function useHoyFocusTaskMeta(tasks: Task[]) {
  const [planningMeta, setPlanningMeta] = useState<Record<string, TaskPlanningMeta>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const map = await loadTaskPlanningMetaMap();
      if (!cancelled) setPlanningMeta(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [tasks]);

  const reloadPlanningMeta = useCallback(async () => {
    const map = await loadTaskPlanningMetaMap();
    setPlanningMeta(map);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reloadPlanningMeta();
    }, [reloadPlanningMeta]),
  );

  const projectProgress = useMemo(() => buildProjectProgressMap(tasks), [tasks]);

  return { planningMeta, projectProgress };
}

export type { ProjectProgressMap };
