import { supabase, getSchemaSetupMessage } from '@/lib/supabase';
import { normalizeDueDateInput } from '@/lib/projectProgress';
import type { AppLocale } from '@/lib/i18n';
import { translate } from '@/lib/i18n';

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
  existingNames?: string[];
  locale?: AppLocale;
};

export type CreateProjectResult =
  | { ok: true; project: CreatedProject }
  | { ok: false; reason: 'empty' | 'too_short' | 'duplicate' | 'invalid_due_date' | 'schema' | 'db' };

import { validateProjectName } from '@/lib/projectNameValidation';

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

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: input.userId,
      name: projectName,
      color: input.color,
      due_date,
    })
    .select('id, name, color, due_date')
    .single();

  if (error) {
    const schemaType = getSchemaSetupMessage(error);
    return { ok: false, reason: schemaType === 'projects_table' ? 'schema' : 'db' };
  }

  return { ok: true, project: data as CreatedProject };
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
