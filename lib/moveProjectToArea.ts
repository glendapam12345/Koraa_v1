import { supabase } from '@/lib/supabase';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';

export async function moveProjectToArea(
  projectId: string,
  lifeAreaRef: LifeAreaRef,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from('projects')
    .update({ life_area_key: lifeAreaRef })
    .eq('id', projectId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
