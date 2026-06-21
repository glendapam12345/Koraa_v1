import { supabase, getSchemaSetupMessage } from '@/lib/supabase';
import { normalizeDueDateInput } from '@/lib/projectProgress';
import type { LifeAreaKey } from '@/lib/lifeAreas/lifeAreaCatalog';
import { inferLifeAreaKeyForProject } from '@/lib/lifeAreas/lifeAreaCatalog';
import { isMissingProjectDueDateColumnError } from '@/lib/projectDueDateSchema';
import { isMissingProjectLifeAreaKeyColumnError } from '@/lib/projectLifeAreaSchema';
import type { AppLocale } from '@/lib/i18n';
import { translate } from '@/lib/i18n';
import { validateProjectName } from '@/lib/projectNameValidation';
import { logger } from '@/lib/logger';

export type CreatedProject = {
  id: string;
  name: string;
  color: string;
  due_date: string | null;
};

export type CreateProjectInput = {
  userId: string;
  name: string;
  color: string;
  dueDateRaw?: string;
  lifeAreaKey?: LifeAreaKey;
  existingNames?: string[];
  locale?: AppLocale;
};

export type CreateProjectResult =
  | { ok: true; project: CreatedProject }
  | { ok: false; reason: 'empty' | 'too_short' | 'duplicate' | 'invalid_due_date' | 'schema' | 'db' };

function isDuplicateProjectNameError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String(error.code || '') : '';
  const message = 'message' in error ? String(error.message || '').toLowerCase() : '';
  return code === '23505' || message.includes('unique') || message.includes('duplicate');
}

function isMissingProfileError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String(error.code || '') : '';
  const message = 'message' in error ? String(error.message || '').toLowerCase() : '';
  return code === '23503' && message.includes('profiles');
}

export async function createProjectForUser(
  input: CreateProjectInput,
): Promise<CreateProjectResult> {
  const locale = input.locale ?? 'es';
  const validated = validateProjectName(input.name, input.existingNames);
  if (!validated.ok) return validated;

  const projectName = validated.name;

  const dueDateRaw = input.dueDateRaw?.trim() ?? '';
  let due_date: string | null = null;
  if (dueDateRaw) {
    due_date = normalizeDueDateInput(dueDateRaw);
    if (!due_date) return { ok: false, reason: 'invalid_due_date' };
  }

  const lifeAreaKey = input.lifeAreaKey ?? inferLifeAreaKeyForProject(projectName);

  const basePayload = {
    user_id: input.userId,
    name: projectName,
    color: input.color,
    life_area_key: lifeAreaKey,
  };

  type Attempt = {
    insert: Record<string, unknown>;
    select: string;
  };

  const attempts: Attempt[] = [];
  if (due_date) {
    attempts.push({
      insert: { ...basePayload, due_date },
      select: 'id, name, color, due_date, life_area_key',
    });
  }
  attempts.push({
    insert: basePayload,
    select: 'id, name, color, life_area_key',
  });
  attempts.push({
    insert: { user_id: input.userId, name: projectName, color: input.color },
    select: 'id, name, color',
  });

  let lastError: unknown = null;

  for (const attempt of attempts) {
    const result = await supabase.from('projects').insert(attempt.insert).select(attempt.select).single();

    if (!result.error && result.data) {
      const row = result.data as unknown as {
        id: string;
        name: string;
        color: string;
        due_date?: string | null;
      };
      return {
        ok: true,
        project: {
          id: row.id,
          name: row.name,
          color: row.color,
          due_date: row.due_date ?? null,
        },
      };
    }

    lastError = result.error;

    if (__DEV__ && result.error) {
      logger.warn('[createProject] insert attempt failed', {
        select: attempt.select,
        hasDueDate: Boolean(due_date),
        message: 'message' in result.error ? String(result.error.message) : String(result.error),
      });
    }

    if (!isMissingProjectDueDateColumnError(result.error) &&
        !isMissingProjectLifeAreaKeyColumnError(result.error)) {
      break;
    }
  }

  const error = lastError;
  if (error) {
    if (isDuplicateProjectNameError(error)) {
      return { ok: false, reason: 'duplicate' };
    }
    if (isMissingProfileError(error)) {
      return { ok: false, reason: 'schema' };
    }
    const schemaType = getSchemaSetupMessage(error);
    return { ok: false, reason: schemaType === 'projects_table' ? 'schema' : 'db' };
  }

  return { ok: false, reason: 'db' };
}

export function createProjectErrorMessage(
  reason: Exclude<CreateProjectResult, { ok: true }>['reason'],
  locale: AppLocale = 'es',
): string {
  switch (reason) {
    case 'empty':
      return translate(locale, 'components.projectNameRequired');
    case 'too_short':
      return translate(locale, 'components.projectNameMin');
    case 'duplicate':
      return translate(locale, 'components.projectDuplicate');
    case 'invalid_due_date':
      return translate(locale, 'projects.dueDateInvalid');
    case 'schema':
      return translate(locale, 'components.projectCreateSchemaError');
    default:
      return translate(locale, 'components.projectCreateError');
  }
}
