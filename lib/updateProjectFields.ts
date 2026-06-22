import { supabase } from '@/lib/supabase';
import { isMissingProjectNotesColumnError } from '@/lib/projectNotesSchema';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';

export type ProjectUpdateFields = {
  name: string;
  color: string;
  due_date: string | null;
  life_area_key: LifeAreaRef;
  notes?: string | null;
};

/** Actualiza un proyecto; omite `notes` si la columna aún no existe en la BD. */
export async function updateProjectFields(
  projectId: string,
  fields: ProjectUpdateFields,
): Promise<{ error: unknown | null }> {
  const base = {
    name: fields.name.trim(),
    color: fields.color,
    due_date: fields.due_date,
    life_area_key: fields.life_area_key,
  };

  if (fields.notes === undefined) {
    const { error } = await supabase.from('projects').update(base).eq('id', projectId);
    return { error };
  }

  const notesValue = fields.notes?.trim() ? fields.notes.trim() : null;
  const withNotes = { ...base, notes: notesValue };
  const { error } = await supabase.from('projects').update(withNotes).eq('id', projectId);

  if (!error) return { error: null };
  if (isMissingProjectNotesColumnError(error)) {
    const retry = await supabase.from('projects').update(base).eq('id', projectId);
    return { error: retry.error };
  }
  return { error };
}
