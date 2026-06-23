import { supabase } from '@/lib/supabase';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { isMissingTaskLifeAreaKeyColumnError } from '@/lib/projectLifeAreaSchema';

export type MoveLooseTaskResult =
  | { ok: true }
  | { ok: false; error: string; reason?: 'schema_missing' };

export async function moveLooseTaskToArea(
  taskId: string,
  lifeAreaRef: LifeAreaRef | null,
): Promise<MoveLooseTaskResult> {
  const { error } = await supabase
    .from('tasks')
    .update({ life_area_key: lifeAreaRef })
    .eq('id', taskId);

  if (error) {
    if (isMissingTaskLifeAreaKeyColumnError(error)) {
      return { ok: false, error: error.message, reason: 'schema_missing' };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
