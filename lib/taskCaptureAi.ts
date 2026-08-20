import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { peekCachedAuthUser } from '@/lib/cachedAuthUser';
import { getLocalDateString } from '@/lib/dateLocal';
import { logger } from '@/lib/logger';
import type { AppLocale } from '@/lib/i18n';
import { parseTaskCaptureLocally } from '@/lib/taskCaptureParseLocal';
import type { ProjectForMatch } from '@/lib/batchProjectMatch';
import { clampEstimatedMinutes } from '@/lib/taskPlanningMeta';
import type { ParsedCaptureTask, TaskCaptureEffort, TaskCaptureResult } from '@/lib/taskCaptureTypes';

function isAiEnabled(): boolean {
  const captureFlag = process.env.EXPO_PUBLIC_TASK_CAPTURE_AI_ENABLED;
  if (captureFlag === 'true' || captureFlag === '1') return true;
  const coachFlag = process.env.EXPO_PUBLIC_HOY_COACH_AI_ENABLED;
  return coachFlag === 'true' || coachFlag === '1';
}

export function isTaskCaptureAiEnabled(): boolean {
  return isAiEnabled();
}

function isValidEffort(value: unknown): value is TaskCaptureEffort {
  return value === 'light' || value === 'medium' || value === 'heavy';
}

function parseTaskRow(raw: unknown, validProjectIds?: Set<string>): ParsedCaptureTask | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const content = typeof row.content === 'string' ? row.content.trim() : '';
  if (!content) return null;
  const scheduled =
    typeof row.scheduled_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.scheduled_date)
      ? row.scheduled_date
      : row.scheduled_date === null
        ? null
        : null;
  const effort = isValidEffort(row.effort) ? row.effort : null;
  const rawProjectId = typeof row.project_id === 'string' ? row.project_id.trim() : null;
  const project_id =
    rawProjectId && validProjectIds && validProjectIds.has(rawProjectId) ? rawProjectId : null;
  const rawMinutes =
    typeof row.estimated_minutes === 'number'
      ? row.estimated_minutes
      : typeof row.estimated_minutes === 'string'
        ? Number(row.estimated_minutes)
        : null;
  const estimated_minutes =
    rawMinutes != null && Number.isFinite(rawMinutes) && rawMinutes > 0
      ? clampEstimatedMinutes(rawMinutes)
      : null;
  return {
    content: content.slice(0, 300),
    scheduled_date: scheduled,
    effort,
    project_id,
    estimated_minutes,
  };
}

export function parseTaskCaptureAiResponse(
  data: unknown,
  validProjectIds?: Set<string>,
): TaskCaptureResult | null {
  if (!data || typeof data !== 'object') return null;
  const root = data as Record<string, unknown>;
  if (root.source !== 'openai') return null;
  const capture = root.capture;
  if (!capture || typeof capture !== 'object') return null;
  const cap = capture as Record<string, unknown>;
  const main = parseTaskRow(cap.main_task, validProjectIds);
  if (!main) return null;
  const summary = typeof cap.summary === 'string' ? cap.summary.trim().slice(0, 400) : '';
  const prepRaw = Array.isArray(cap.prep_steps) ? cap.prep_steps : [];
  const prep_steps = prepRaw
    .map((row) => parseTaskRow(row, validProjectIds))
    .filter((row): row is ParsedCaptureTask => row !== null)
    .slice(0, 5);
  return {
    summary: summary || main.content,
    main_task: main,
    prep_steps,
    fromAi: true,
  };
}

async function logInvokeFailure(error: unknown): Promise<void> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      logger.debug('[task-capture-ai] HTTP fallback:', body);
    } catch {
      logger.debug('[task-capture-ai] HTTP', error.context.status, error.message);
    }
    return;
  }
  if (error instanceof FunctionsRelayError) {
    logger.debug('[task-capture-ai] Relay fallback:', error.message);
    return;
  }
  if (error instanceof FunctionsFetchError) {
    logger.debug('[task-capture-ai] Network fallback:', error.message);
    return;
  }
  logger.debug('[task-capture-ai] fallback:', error);
}

export type InterpretTaskCaptureInput = {
  rawText: string;
  locale: AppLocale;
  energyLevel?: number;
  emotionKey?: string;
  /** Proyectos existentes para que la IA sugiera agrupación por paso. */
  projects?: ProjectForMatch[];
};

/**
 * Interpreta captura en lenguaje natural. IA vía Edge Function; fallback local siempre disponible.
 */
export async function interpretTaskCapture(
  userId: string | undefined,
  input: InterpretTaskCaptureInput,
): Promise<TaskCaptureResult> {
  const local = parseTaskCaptureLocally(input.rawText, input.locale);

  if (!userId || !isAiEnabled() || !isSupabaseConfigured) {
    return local;
  }

  try {
    if (!peekCachedAuthUser()) {
      return local;
    }

    const projects = (input.projects ?? [])
      .filter((p) => p.id && p.name?.trim())
      .map((p) => ({ id: p.id, name: p.name.trim().slice(0, 80) }))
      .slice(0, 40);
    const validProjectIds = new Set(projects.map((p) => p.id));

    const invokePromise = Promise.resolve(
      supabase.functions.invoke('task-capture-ai', {
        body: {
          locale: input.locale,
          rawText: input.rawText.trim().slice(0, 500),
          today: getLocalDateString(),
          energyLevel: input.energyLevel ?? null,
          emotionKey: input.emotionKey ?? null,
          projects,
        },
      }),
    );
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<{ data: null; error: { message: string } }>((resolve) => {
      timeoutId = setTimeout(() => resolve({ data: null, error: { message: 'timeout' } }), 5000);
    });
    try {
      const { data, error } = await Promise.race([invokePromise, timedOut]);

      if (error) {
        if (!('message' in error && error.message === 'timeout')) {
          await logInvokeFailure(error);
        }
        return local;
      }

      const parsed = parseTaskCaptureAiResponse(data, validProjectIds);
      if (!parsed) {
        if (__DEV__) logger.debug('[task-capture-ai] local fallback');
        return local;
      }

      if (__DEV__) {
        logger.debug('[task-capture-ai] OK (IA)');
      }

      return parsed;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  } catch {
    return local;
  }
}
