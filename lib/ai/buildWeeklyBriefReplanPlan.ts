import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dateLocal';
import type { AppLocale } from '@/lib/i18n';
import { loadTaskPlanningMetaMap } from '@/lib/taskPlanningMeta';
import { resolveTaskPlannedMinutes } from '@/lib/hoy/dayCapacity';
import type { Task } from '@/components/tasks/TaskCard';
import { fetchAdaptiveReorganizePlan } from '@/lib/adaptiveReorganizeAi';
import {
  buildAdaptiveReorganizePlan,
  type ExperienceTask,
} from '@/lib/lifeAreas/experienceDataMappers';
import { buildLifeAreaIndex } from '@/lib/lifeAreas/projectToLifeArea';
import type { KoraaWeekContext } from '@/lib/ai/types';
import {
  buildWeekBalanceReorganizePlan,
  getWeekDatesForStart,
} from '@/lib/ai/buildWeekBalanceReplan';
import {
  inferWeekReplanReason,
  serializeWeekContextForAi,
} from '@/lib/ai/inferWeekReplanReason';
import type { DayReflectionReplanBuildResult } from '@/lib/vnext/executeDayReflectionReplan';

/** Propuesta de replan desde el brief semanal (IA + fallback local). */
export async function buildWeeklyBriefReplanPlan(
  userId: string,
  locale: AppLocale,
  looseLabel: string,
  weekContext: KoraaWeekContext,
): Promise<DayReflectionReplanBuildResult> {
  const today = getLocalDateString();
  const weekDates = getWeekDatesForStart(weekContext.weekStart);
  const reason = inferWeekReplanReason(weekContext);

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
          locale === 'en' ? 'Your week already looks calm.' : 'Tu semana ya se ve tranquila.',
        subline:
          locale === 'en' ? 'Nothing left to move right now.' : 'No hay nada pendiente por mover ahora.',
        moved: [],
        kept: [],
      },
      assignments: [],
      usedAi: false,
    };
  }

  const areaIndex = buildLifeAreaIndex(projects, looseLabel);

  const planningMeta = await loadTaskPlanningMetaMap();
  const plannedMinutesByDay: Record<string, number> = {};

  for (const task of tasks) {
    const date =
      task.scheduled_date && weekDates.includes(task.scheduled_date)
        ? task.scheduled_date
        : today;
    plannedMinutesByDay[date] =
      (plannedMinutesByDay[date] ?? 0) +
      resolveTaskPlannedMinutes(task as Task, planningMeta);
  }

  const taskPlanning = Object.fromEntries(
    tasks.map((task) => {
      const meta = planningMeta[task.id];
      return [
        task.id,
        {
          estimatedMinutes: meta?.estimatedMinutes,
          preferredTime: meta?.preferredTime ?? null,
        },
      ];
    }),
  );

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
    weekContext: serializeWeekContextForAi(weekContext, { plannedMinutesByDay }),
    taskPlanning,
  });

  const plan =
    aiPlan ??
    (reason === 'week_balance'
      ? buildWeekBalanceReorganizePlan(tasks, areaIndex, weekContext, locale, projectDueDates)
      : buildAdaptiveReorganizePlan(tasks, areaIndex, reason, locale, today, projectDueDates));

  return {
    ok: true,
    proposal: plan.proposal,
    assignments: plan.assignments,
    usedAi: Boolean(aiPlan),
  };
}
