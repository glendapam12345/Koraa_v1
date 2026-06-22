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

export type DayReflectionReplanBuildResult =
  | {
      ok: true;
      proposal: ReorganizeWeekProposal;
      assignments: { id: string; scheduled_date: string }[];
      usedAi: boolean;
    }
  | { ok: false; error: string };

export type DayReflectionReplanResult =
  | {
      ok: true;
      proposal: ReorganizeWeekProposal;
      movedCount: number;
      usedAi: boolean;
    }
  | { ok: false; error: string };

/** Genera propuesta de reorganización sin guardar en Supabase. */
export async function buildDayReplanPlan(
  userId: string,
  reason: WhatChangedReason,
  locale: AppLocale,
  looseLabel: string,
): Promise<DayReflectionReplanBuildResult> {
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
            ? 'Your day already looks calm.'
            : 'Tu día ya se ve tranquilo.',
        subline:
          locale === 'en'
            ? 'Nothing left to move right now.'
            : 'No hay nada pendiente por mover ahora.',
        moved: [],
        kept: [],
      },
      assignments: [],
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

  return {
    ok: true,
    proposal: plan.proposal,
    assignments: plan.assignments,
    usedAi: Boolean(aiPlan),
  };
}

export async function applyDayReplanAssignments(
  userId: string,
  assignments: { id: string; scheduled_date: string }[],
): Promise<{ ok: true; movedCount: number } | { ok: false; error: string }> {
  if (assignments.length === 0) {
    return { ok: true, movedCount: 0 };
  }

  const updates = await Promise.all(
    assignments.map((entry) =>
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

  return { ok: true, movedCount: assignments.length };
}

export async function executeDayReflectionReplan(
  userId: string,
  reason: WhatChangedReason,
  locale: AppLocale,
  looseLabel: string,
): Promise<DayReflectionReplanResult> {
  const built = await buildDayReplanPlan(userId, reason, locale, looseLabel);
  if (!built.ok) return built;

  if (built.assignments.length === 0) {
    return {
      ok: true,
      proposal: built.proposal,
      movedCount: 0,
      usedAi: built.usedAi,
    };
  }

  const applied = await applyDayReplanAssignments(userId, built.assignments);
  if (!applied.ok) return applied;

  return {
    ok: true,
    proposal: built.proposal,
    movedCount: applied.movedCount,
    usedAi: built.usedAi,
  };
}
