import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dateLocal';
import type { AppLocale } from '@/lib/i18n';
import {
  fetchAdaptiveReorganizePlan,
} from '@/lib/adaptiveReorganizeAi';
import {
  buildAdaptiveReorganizePlan,
  getCurrentWeekDates,
  type ExperienceTask,
} from '@/lib/lifeAreas/experienceDataMappers';
import { buildLifeAreaIndex } from '@/lib/lifeAreas/projectToLifeArea';
import type { ReorganizeWeekProposal, WhatChangedReason } from '@/lib/lifeAreas/types';

export type DayReflectionReplanResult =
  | {
      ok: true;
      proposal: ReorganizeWeekProposal;
      movedCount: number;
      usedAi: boolean;
    }
  | { ok: false; error: string };

export async function executeDayReflectionReplan(
  userId: string,
  reason: WhatChangedReason,
  locale: AppLocale,
  looseLabel: string,
): Promise<DayReflectionReplanResult> {
  const today = getLocalDateString();
  const weekDates = getCurrentWeekDates(today);

  const [projectsRes, tasksRes] = await Promise.all([
    supabase.from('projects').select('id, name, color, due_date').eq('user_id', userId),
    supabase
      .from('tasks')
      .select('id, content, project_id, scheduled_date, is_completed, is_priority')
      .eq('user_id', userId)
      .is('parent_task_id', null)
      .eq('is_completed', false)
      .order('created_at', { ascending: false })
      .limit(60),
  ]);

  if (projectsRes.error) {
    return { ok: false, error: projectsRes.error.message };
  }
  if (tasksRes.error) {
    return { ok: false, error: tasksRes.error.message };
  }

  const projects = projectsRes.data ?? [];
  const tasks = (tasksRes.data ?? []) as ExperienceTask[];
  const projectDueDates = Object.fromEntries(
    projects.map((project) => [project.id, project.due_date ?? null]),
  );

  if (tasks.length === 0) {
    return {
      ok: true,
      proposal: {
        headline:
          locale === 'en'
            ? 'Your week already looks calm.'
            : 'Tu semana ya se ve tranquila.',
        subline:
          locale === 'en'
            ? 'Nothing left to move right now.'
            : 'No hay nada pendiente por mover ahora.',
        moved: [],
        kept: [],
      },
      movedCount: 0,
      usedAi: false,
    };
  }

  const areaIndex = buildLifeAreaIndex(projects, looseLabel);

  const aiPlan = await fetchAdaptiveReorganizePlan({
    locale,
    reason,
    today,
    weekDates,
    tasks,
    areaIndex,
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      due_date: project.due_date ?? null,
    })),
  });

  const plan =
    aiPlan ??
    buildAdaptiveReorganizePlan(tasks, areaIndex, reason, locale, today, projectDueDates);

  if (plan.assignments.length === 0) {
    return {
      ok: true,
      proposal: plan.proposal,
      movedCount: 0,
      usedAi: Boolean(aiPlan),
    };
  }

  const updates = await Promise.all(
    plan.assignments.map((entry) =>
      supabase
        .from('tasks')
        .update({ scheduled_date: entry.scheduled_date })
        .eq('id', entry.id)
        .eq('user_id', userId),
    ),
  );

  const failed = updates.find((result) => result.error);
  if (failed?.error) {
    return { ok: false, error: failed.error.message };
  }

  return {
    ok: true,
    proposal: plan.proposal,
    movedCount: plan.proposal.moved.length,
    usedAi: Boolean(aiPlan),
  };
}
