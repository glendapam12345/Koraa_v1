import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dateLocal';
import { useI18n } from '@/contexts/I18nContext';
import {
  fetchAdaptiveReorganizePlan,
  projectListFromAreaIndex,
} from '@/lib/adaptiveReorganizeAi';
import type {
  FloatingThoughtCard,
  LifeArea,
  ReorganizeWeekProposal,
  WeekPlannerDay,
  WhatChangedReason,
} from '@/lib/lifeAreas/types';
import {
  applyAssignmentsToTasks,
  buildAdaptiveReorganizePlan,
  buildWeekPlannerDays,
  getCurrentWeekDates,
  tasksToFloatingThoughts,
  type ExperienceTask,
} from '@/lib/lifeAreas/experienceDataMappers';
import { buildMonthPlannerModel } from '@/lib/lifeAreas/monthPlanner';
import { buildLifeAreaIndex } from '@/lib/lifeAreas/projectToLifeArea';
import {
  VISION_FLOATING_THOUGHTS,
  VISION_LIFE_AREAS,
  VISION_REORGANIZE_RESULT,
  VISION_WEEK_DAYS,
} from '@/lib/lifeAreas/visionMockData';

type UseAdaptiveExperienceOptions = {
  userId?: string;
};

function moveTaskInWeekDays(
  days: WeekPlannerDay[],
  taskId: string,
  targetDayId: string,
): WeekPlannerDay[] {
  const taskEntry = days.flatMap((day) => day.tasks).find((task) => task.id === taskId);
  if (!taskEntry) return days;

  const nextTask = { ...taskEntry, scheduledDate: targetDayId };
  return days.map((day) => {
    const tasks = day.tasks.filter((task) => task.id !== taskId);
    if (day.id === targetDayId) {
      return {
        ...day,
        tasks: [...tasks, nextTask],
        summary: `${tasks.length + 1} pasos`,
      };
    }
    return { ...day, tasks };
  });
}

export function useAdaptiveExperience({ userId }: UseAdaptiveExperienceOptions) {
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(Boolean(userId));
  const [tasks, setTasks] = useState<ExperienceTask[]>([]);
  const [areas, setAreas] = useState<LifeArea[]>([]);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [sampleWeekDays, setSampleWeekDays] = useState<WeekPlannerDay[]>(VISION_WEEK_DAYS);
  const [lastReason, setLastReason] = useState<WhatChangedReason | null>(null);
  const [lastProposal, setLastProposal] = useState<ReorganizeWeekProposal | null>(null);
  const [usedAi, setUsedAi] = useState(false);

  const today = getLocalDateString();
  const weekDates = useMemo(() => getCurrentWeekDates(today), [today]);

  const areaIndex = useMemo(() => {
    const looseLabel = t('projectsUi.looseTitle');
    const projects = areas
      .filter((area) => area.id !== 'loose')
      .map((area) => ({ id: area.id, name: area.name, color: area.color }));
    return buildLifeAreaIndex(projects, looseLabel);
  }, [areas, t]);

  const load = useCallback(async () => {
    if (!userId) {
      setUsingSampleData(true);
      setAreas(VISION_LIFE_AREAS);
      setTasks([]);
      setSampleWeekDays(VISION_WEEK_DAYS);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        supabase.from('projects').select('id, name, color').eq('user_id', userId),
        supabase
          .from('tasks')
          .select('id, content, project_id, scheduled_date, is_completed, is_priority')
          .eq('user_id', userId)
          .is('parent_task_id', null)
          .eq('is_completed', false)
          .order('created_at', { ascending: false })
          .limit(40),
      ]);

      const projects = projectsRes.data ?? [];
      const looseLabel = t('projectsUi.looseTitle');
      const index = buildLifeAreaIndex(projects, looseLabel);
      const mappedAreas = [...index.values()];

      const loadedTasks = (tasksRes.data ?? []) as ExperienceTask[];
      const hasRealTasks = loadedTasks.length > 0;

      setAreas(hasRealTasks ? mappedAreas : VISION_LIFE_AREAS);
      setTasks(loadedTasks);
      setUsingSampleData(!hasRealTasks);
      if (!hasRealTasks) setSampleWeekDays(VISION_WEEK_DAYS);
    } finally {
      setLoading(false);
    }
  }, [t, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const floatingThoughts: FloatingThoughtCard[] = useMemo(() => {
    if (usingSampleData) return VISION_FLOATING_THOUGHTS;
    return tasksToFloatingThoughts(tasks, areaIndex);
  }, [areaIndex, tasks, usingSampleData]);

  const weekDays: WeekPlannerDay[] = useMemo(() => {
    if (usingSampleData) return sampleWeekDays;
    return buildWeekPlannerDays(tasks, weekDates, today, areaIndex, locale);
  }, [areaIndex, locale, sampleWeekDays, tasks, today, usingSampleData, weekDates]);

  const monthModel = useMemo(() => {
    if (usingSampleData) return buildMonthPlannerModel([], today, locale);
    return buildMonthPlannerModel(tasks, today, locale);
  }, [locale, tasks, today, usingSampleData]);

  const reorganize = useCallback(
    async (reason: WhatChangedReason) => {
      setLastReason(reason);
      setUsedAi(false);

      if (usingSampleData) {
        setLastProposal(VISION_REORGANIZE_RESULT);
        return { ok: true as const, proposal: VISION_REORGANIZE_RESULT, usedAi: false };
      }

      const aiPlan = await fetchAdaptiveReorganizePlan({
        locale,
        reason,
        today,
        weekDates,
        tasks,
        areaIndex,
        projects: projectListFromAreaIndex(areaIndex),
      });

      const plan =
        aiPlan ??
        buildAdaptiveReorganizePlan(tasks, areaIndex, reason, locale, today);

      setUsedAi(Boolean(aiPlan));
      setLastProposal(plan.proposal);

      if (plan.assignments.length === 0) {
        return { ok: true as const, proposal: plan.proposal, usedAi: Boolean(aiPlan) };
      }

      const updates = await Promise.all(
        plan.assignments.map((entry) =>
          supabase
            .from('tasks')
            .update({ scheduled_date: entry.scheduled_date })
            .eq('id', entry.id),
        ),
      );

      const failed = updates.find((result) => result.error);
      if (failed?.error) {
        return { ok: false as const, error: failed.error.message };
      }

      setTasks((current) => applyAssignmentsToTasks(current, plan.assignments));
      return { ok: true as const, proposal: plan.proposal, usedAi: Boolean(aiPlan) };
    },
    [areaIndex, locale, tasks, today, usingSampleData, weekDates],
  );

  const moveTaskToDay = useCallback(
    async (taskId: string, dayId: string) => {
      if (usingSampleData) {
        setSampleWeekDays((current) => moveTaskInWeekDays(current, taskId, dayId));
        return { ok: true as const };
      }

      const { error } = await supabase
        .from('tasks')
        .update({ scheduled_date: dayId })
        .eq('id', taskId);

      if (error) return { ok: false as const, error: error.message };

      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, scheduled_date: dayId } : task,
        ),
      );
      return { ok: true as const };
    },
    [usingSampleData],
  );

  return {
    loading,
    usingSampleData,
    usedAi,
    areas,
    floatingThoughts,
    weekDays,
    monthModel,
    lastProposal,
    lastReason,
    reorganize,
    moveTaskToDay,
    reload: load,
  };
}
