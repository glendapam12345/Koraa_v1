import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { AppLocale } from '@/lib/i18n';
import type { LifeArea, WhatChangedReason } from '@/lib/lifeAreas/types';
import type { ExperienceTask, ReorganizePlan } from '@/lib/lifeAreas/experienceDataMappers';
import {
  formatProposalDeadlineLabel,
  formatProposalScheduleLabel,
} from '@/lib/lifeAreas/experienceDataMappers';
import { LOOSE_LIFE_AREA_ID, resolveLifeArea } from '@/lib/lifeAreas/projectToLifeArea';

export type AdaptiveReorganizeAiInput = {
  locale: AppLocale;
  reason: WhatChangedReason;
  today: string;
  weekDates: string[];
  tasks: ExperienceTask[];
  areaIndex: Map<string, LifeArea>;
  projects: { id: string; name: string; due_date?: string | null }[];
  weekContext?: Record<string, unknown>;
  taskPlanning?: Record<string, { estimatedMinutes?: number; preferredTime?: string | null }>;
};

type AiReorganizeResponse = {
  plan: {
    headline: string;
    subline: string;
    moved: ReorganizePlan['proposal']['moved'];
    kept: ReorganizePlan['proposal']['kept'];
    freedHoursLabel?: string;
    assignments: { id: string; scheduled_date: string }[];
  };
  source?: string;
};

function isAiEnabled(): boolean {
  const flag = process.env.EXPO_PUBLIC_HOY_COACH_AI_ENABLED;
  return flag === 'true' || flag === '1';
}

async function logInvokeFailure(error: unknown): Promise<void> {
  if (!__DEV__) return;

  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      logger.warn('[adaptive-reorganize] HTTP error:', body);
    } catch {
      logger.warn('[adaptive-reorganize] HTTP', error.context.status, error.message);
    }
    return;
  }

  if (error instanceof FunctionsRelayError) {
    logger.warn('[adaptive-reorganize] Relay:', error.message);
    return;
  }

  if (error instanceof FunctionsFetchError) {
    logger.warn('[adaptive-reorganize] Network:', error.message);
    return;
  }

  logger.warn('[adaptive-reorganize]', error);
}

function sanitizeAssignments(
  assignments: { id: string; scheduled_date: string }[],
  tasks: ExperienceTask[],
  weekDates: string[],
  today: string,
): { id: string; scheduled_date: string }[] {
  const allowedDates = new Set([...weekDates, today]);
  const taskIds = new Set(tasks.map((task) => task.id));
  const seen = new Set<string>();

  return assignments.filter((entry) => {
    if (!taskIds.has(entry.id) || seen.has(entry.id)) return false;
    if (!allowedDates.has(entry.scheduled_date)) return false;
    seen.add(entry.id);
    return true;
  });
}

function enrichPlan(
  raw: AiReorganizeResponse['plan'],
  tasks: ExperienceTask[],
  areaIndex: Map<string, LifeArea>,
  weekDates: string[],
  today: string,
  locale: AppLocale,
  projectDueDates: Record<string, string | null>,
): ReorganizePlan {
  const assignments = sanitizeAssignments(raw.assignments ?? [], tasks, weekDates, today);
  const open = tasks.filter((task) => !task.is_completed);
  const assignmentMap = new Map(assignments.map((entry) => [entry.id, entry.scheduled_date]));

  const moved = assignments.map((entry) => {
    const task = open.find((item) => item.id === entry.id)!;
    const area = resolveLifeArea(areaIndex, task.project_id);
    const fromRaw = raw.moved?.find((item) => item.taskId === entry.id);
    const fromIso = task.scheduled_date ?? undefined;
    const toIso = entry.scheduled_date;
    const fromLabel = fromIso ? formatProposalScheduleLabel(fromIso, locale) : fromRaw?.fromLabel;
    const toLabel = formatProposalScheduleLabel(toIso, locale);
    const deadline = formatProposalDeadlineLabel(
      task.project_id ? projectDueDates[task.project_id] : null,
      locale,
    );
    return {
      taskId: entry.id,
      title: fromRaw?.title ?? task.content,
      areaEmoji: fromRaw?.areaEmoji ?? area.emoji,
      areaColor: fromRaw?.areaColor ?? area.color,
      fromLabel,
      toLabel,
      deadlineLabel: deadline,
    };
  });

  const movedIds = new Set(assignments.map((entry) => entry.id));
  const keptFromAi = (raw.kept ?? [])
    .filter((item) => !movedIds.has(item.taskId))
    .map((item) => {
      const task = open.find((entry) => entry.id === item.taskId);
      if (!task) return item;
      const dateLabel = task.scheduled_date
        ? formatProposalScheduleLabel(task.scheduled_date, locale)
        : item.dateLabel;
      const deadline =
        formatProposalDeadlineLabel(
          task.project_id ? projectDueDates[task.project_id] : null,
          locale,
        ) ?? item.deadlineLabel;
      return { ...item, dateLabel, deadlineLabel: deadline };
    });
  const kept =
    keptFromAi.length > 0
      ? keptFromAi
      : open
          .filter((task) => !movedIds.has(task.id))
          .slice(0, 6)
          .map((task) => {
            const area = resolveLifeArea(areaIndex, task.project_id);
            const dateLabel = task.scheduled_date
              ? formatProposalScheduleLabel(task.scheduled_date, locale)
              : undefined;
            const deadline = formatProposalDeadlineLabel(
              task.project_id ? projectDueDates[task.project_id] : null,
              locale,
            );
            return {
              taskId: task.id,
              title: task.content,
              areaEmoji: area.emoji,
              areaColor: area.color,
              dateLabel,
              deadlineLabel: deadline,
            };
          });

  return {
    proposal: {
      headline: raw.headline,
      subline: raw.subline,
      moved,
      kept,
      freedHoursLabel: raw.freedHoursLabel,
    },
    assignments,
  };
}

export async function fetchAdaptiveReorganizePlan(
  input: AdaptiveReorganizeAiInput,
): Promise<ReorganizePlan | null> {
  if (!isAiEnabled() || !isSupabaseConfigured) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const openTasks = input.tasks.filter((task) => !task.is_completed);

  try {
    const { data, error } = await supabase.functions.invoke<AiReorganizeResponse>(
      'adaptive-reorganize',
      {
        body: {
          locale: input.locale,
          reason: input.reason,
          today: input.today,
          week_dates: input.weekDates,
          week_context: input.weekContext,
          tasks: openTasks.map((task) => ({
            id: task.id,
            content: task.content,
            project_id: task.project_id,
            scheduled_date: task.scheduled_date,
            is_priority: task.is_priority,
            estimated_minutes: input.taskPlanning?.[task.id]?.estimatedMinutes,
            preferred_time: input.taskPlanning?.[task.id]?.preferredTime,
          })),
          projects: input.projects,
          task_planning: input.taskPlanning,
        },
      },
    );

    if (error) {
      await logInvokeFailure(error);
      return null;
    }

    if (!data?.plan?.headline || !Array.isArray(data.plan.assignments)) {
      if (__DEV__) logger.warn('[adaptive-reorganize] Invalid response:', data);
      return null;
    }

    const plan = enrichPlan(
      data.plan,
      input.tasks,
      input.areaIndex,
      input.weekDates,
      input.today,
      input.locale,
      Object.fromEntries(
        input.projects.map((project) => [project.id, project.due_date ?? null]),
      ),
    );

    if (__DEV__) logger.debug('[adaptive-reorganize] OK (AI)', plan.assignments.length);
    return plan;
  } catch (error) {
    await logInvokeFailure(error);
    return null;
  }
}

export function projectListFromAreaIndex(areaIndex: Map<string, LifeArea>) {
  return [...areaIndex.values()]
    .filter((area) => area.id !== LOOSE_LIFE_AREA_ID)
    .map((area) => ({ id: area.id, name: area.name }));
}
