import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/dateLocal';
import { logger } from '@/lib/logger';
import type { AppLocale } from '@/lib/i18n';
import { parseTaskCaptureLocally } from '@/lib/taskCaptureParseLocal';
import type { ProjectForMatch } from '@/lib/batchProjectMatch';
import type { ParsedCaptureTask, TaskCaptureEffort, TaskCaptureResult } from '@/lib/taskCaptureTypes';

function isAiEnabled(): boolean {
  const captureFlag = process.env.EXPO_PUBLIC_TASK_CAPTURE_AI_ENABLED;
  if (captureFlag === 'true' || captureFlag === '1') return true;
  const coachFlag = process.env.EXPO_PUBLIC_HOY_COACH_AI_ENABLED;
  return coachFlag === 'true' || coachFlag === '1';
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
  return { content: content.slice(0, 300), scheduled_date: scheduled, effort, project_id };
}

function parseCapturePayload(
  data: unknown,
  validProjectIds?: Set<string>,
): TaskCaptureResult | null {
  if (!data || typeof data !== 'object') return null;
  const root = data as Record<string, unknown>;
  const capture = root.capture ?? root;
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
    fromAi: root.source === 'openai',
  };
}

async function logInvokeFailure(error: unknown): Promise<void> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      logger.warn('[task-capture-ai] HTTP error:', body);
    } catch {
      logger.warn('[task-capture-ai] HTTP', error.context.status, error.message);
    }
    return;
  }
  if (error instanceof FunctionsRelayError) {
    logger.warn('[task-capture-ai] Relay:', error.message);
    return;
  }
  if (error instanceof FunctionsFetchError) {
    logger.warn('[task-capture-ai] Network:', error.message);
    return;
  }
  logger.warn('[task-capture-ai]', error);
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
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.access_token) {
      return local;
    }

    const projects = (input.projects ?? [])
      .filter((p) => p.id && p.name?.trim())
      .map((p) => ({ id: p.id, name: p.name.trim().slice(0, 80) }))
      .slice(0, 40);
    const validProjectIds = new Set(projects.map((p) => p.id));

    const { data, error } = await supabase.functions.invoke('task-capture-ai', {
      body: {
        locale: input.locale,
        rawText: input.rawText.trim().slice(0, 500),
        today: getLocalDateString(),
        energyLevel: input.energyLevel ?? null,
        emotionKey: input.emotionKey ?? null,
        projects,
      },
    });

    if (error) {
      await logInvokeFailure(error);
      return local;
    }

    const parsed = parseCapturePayload(data, validProjectIds);
    if (!parsed) {
      if (__DEV__) logger.warn('[task-capture-ai] Invalid response:', data);
      return local;
    }

    if (__DEV__ && parsed.fromAi) {
      logger.debug('[task-capture-ai] OK (IA)');
    }

    return parsed;
  } catch (err) {
    logger.warn('[task-capture-ai] Unexpected:', err);
    return local;
  }
}
