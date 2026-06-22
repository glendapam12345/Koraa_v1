/** Detecta si Supabase/PostgREST no tiene la columna `projects.due_date` (migración pendiente). */
export function isMissingProjectDueDateColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const code = 'code' in error ? String(error.code || '') : '';
  const msg = ('message' in error ? String(error.message || '') : '').toLowerCase();

  if (code === 'PGRST204' && msg.includes('due_date')) return true;

  return (
    msg.includes('projects.due_date') ||
    (msg.includes('due_date') &&
      (msg.includes('schema cache') ||
        msg.includes('does not exist') ||
        msg.includes('no existe') ||
        msg.includes('could not find')))
  );
}

export type ProjectRowBase = {
  id: string;
  name: string;
  color: string;
};

import { isMissingProjectLifeAreaKeyColumnError } from '@/lib/projectLifeAreaSchema';
import { isMissingProjectNotesColumnError } from '@/lib/projectNotesSchema';

export type ProjectRowWithDueDate = ProjectRowBase & {
  due_date: string | null;
  life_area_key?: string | null;
  priority?: number;
  notes?: string | null;
};

/** Carga proyectos con fallback si `due_date` aún no está en la BD remota. */
export async function fetchUserProjects(
  userId: string,
): Promise<{ data: ProjectRowWithDueDate[]; supportsDueDate: boolean; error: unknown | null }> {
  const { supabase } = await import('@/lib/supabase');

  const withExtended = await supabase
    .from('projects')
    .select('id, name, color, due_date, life_area_key, priority, notes')
    .eq('user_id', userId)
    .order('priority', { ascending: false });

  if (!withExtended.error) {
    return {
      data: ((withExtended.data || []) as ProjectRowWithDueDate[]).map((p) => ({
        ...p,
        due_date: p.due_date ?? null,
        life_area_key: p.life_area_key ?? null,
        notes: p.notes ?? null,
      })),
      supportsDueDate: true,
      error: null,
    };
  }

  if (isMissingProjectNotesColumnError(withExtended.error)) {
    const withoutNotes = await supabase
      .from('projects')
      .select('id, name, color, due_date, life_area_key, priority')
      .eq('user_id', userId)
      .order('priority', { ascending: false });

    if (!withoutNotes.error) {
      return {
        data: ((withoutNotes.data || []) as ProjectRowWithDueDate[]).map((p) => ({
          ...p,
          due_date: p.due_date ?? null,
          life_area_key: p.life_area_key ?? null,
          notes: null,
        })),
        supportsDueDate: true,
        error: null,
      };
    }
  }

  if (
    !isMissingProjectDueDateColumnError(withExtended.error) &&
    !isMissingProjectLifeAreaKeyColumnError(withExtended.error) &&
    !isMissingProjectNotesColumnError(withExtended.error)
  ) {
    return { data: [], supportsDueDate: true, error: withExtended.error };
  }

  const withDue = await supabase
    .from('projects')
    .select('id, name, color, due_date')
    .eq('user_id', userId)
    .order('priority', { ascending: false });

  if (!withDue.error) {
    return {
      data: ((withDue.data || []) as ProjectRowWithDueDate[]).map((p) => ({
        ...p,
        due_date: p.due_date ?? null,
        life_area_key: null,
      })),
      supportsDueDate: true,
      error: null,
    };
  }

  if (!isMissingProjectDueDateColumnError(withDue.error)) {
    return { data: [], supportsDueDate: true, error: withDue.error };
  }

  const withoutDue = await supabase
    .from('projects')
    .select('id, name, color')
    .eq('user_id', userId)
    .order('priority', { ascending: false });

  if (withoutDue.error) {
    return { data: [], supportsDueDate: false, error: withoutDue.error };
  }

  return {
    data: ((withoutDue.data || []) as ProjectRowBase[]).map((p) => ({
      ...p,
      due_date: null,
      life_area_key: null,
    })),
    supportsDueDate: false,
    error: null,
  };
}

export type ProjectDetailRow = {
  name: string;
  color: string;
  due_date: string | null;
  life_area_key?: string | null;
  notes?: string | null;
};

/** Carga un proyecto por id con fallback si `due_date` no existe en la BD. */
export async function fetchProjectById(
  userId: string,
  projectId: string,
): Promise<{ data: ProjectDetailRow | null; error: unknown | null }> {
  const { supabase } = await import('@/lib/supabase');

  const withExtended = await supabase
    .from('projects')
    .select('name, color, due_date, life_area_key, notes')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!withExtended.error && withExtended.data) {
    const row = withExtended.data as {
      name: string;
      color: string;
      due_date?: string | null;
      life_area_key?: string | null;
      notes?: string | null;
    };
    return {
      data: {
        name: row.name,
        color: row.color,
        due_date: row.due_date ?? null,
        life_area_key: row.life_area_key ?? null,
        notes: row.notes ?? null,
      },
      error: null,
    };
  }

  if (withExtended.error && isMissingProjectNotesColumnError(withExtended.error)) {
    const withoutNotes = await supabase
      .from('projects')
      .select('name, color, due_date, life_area_key')
      .eq('id', projectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!withoutNotes.error && withoutNotes.data) {
      const row = withoutNotes.data as {
        name: string;
        color: string;
        due_date?: string | null;
        life_area_key?: string | null;
      };
      return {
        data: {
          name: row.name,
          color: row.color,
          due_date: row.due_date ?? null,
          life_area_key: row.life_area_key ?? null,
          notes: null,
        },
        error: null,
      };
    }
  }

  if (
    withExtended.error &&
    !isMissingProjectDueDateColumnError(withExtended.error) &&
    !isMissingProjectLifeAreaKeyColumnError(withExtended.error) &&
    !isMissingProjectNotesColumnError(withExtended.error)
  ) {
    return { data: null, error: withExtended.error };
  }

  const withDue = await supabase
    .from('projects')
    .select('name, color, due_date')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!withDue.error && withDue.data) {
    const row = withDue.data as { name: string; color: string; due_date?: string | null };
    return {
      data: {
        name: row.name,
        color: row.color,
        due_date: row.due_date ?? null,
        life_area_key: null,
      },
      error: null,
    };
  }

  if (withDue.error && !isMissingProjectDueDateColumnError(withDue.error)) {
    return { data: null, error: withDue.error };
  }

  const withoutDue = await supabase
    .from('projects')
    .select('name, color')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (withoutDue.error) {
    return { data: null, error: withoutDue.error };
  }

  if (!withoutDue.data) {
    return { data: null, error: withDue.error ?? null };
  }

  const row = withoutDue.data as { name: string; color: string };
  return {
    data: {
      name: row.name,
      color: row.color,
      due_date: null,
      life_area_key: null,
    },
    error: null,
  };
}
