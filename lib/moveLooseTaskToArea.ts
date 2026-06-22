import { supabase } from '@/lib/supabase';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import { isMissingTaskLifeAreaKeyColumnError } from '@/lib/projectLifeAreaSchema';

export async function moveLooseTaskToArea(
  taskId: string,
  lifeAreaRef: LifeAreaRef | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from('tasks')
    .update({ life_area_key: lifeAreaRef })
    .eq('id', taskId);

  if (error) {
    if (isMissingTaskLifeAreaKeyColumnError(error)) {
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
