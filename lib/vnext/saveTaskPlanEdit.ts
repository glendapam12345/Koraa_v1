import { supabase } from '@/lib/supabase';
import {
  setTaskPlanningMeta,
  type TaskPlanningMeta,
} from '@/lib/taskPlanningMeta';
import { setTaskEffort, type TaskEffort } from '@/lib/taskPerceivedEffort';
import type { VnextEnergyLevel } from '@/lib/vnext/types';
import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';

export type TaskPlanEditPayload = {
  taskId: string;
  content: string;
  scheduledDate: string | null;
  projectId: string | null;
  effort: TaskEffort | null;
  planning: TaskPlanningMeta;
  isPriority?: boolean;
  lifeAreaKey?: LifeAreaRef | null;
};

export async function saveTaskPlanEdit(
  payload: TaskPlanEditPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const coreUpdate: Record<string, unknown> = {
    content: payload.content.trim(),
    scheduled_date: payload.scheduledDate,
    project_id: payload.projectId,
    life_area_key: payload.projectId ? null : (payload.lifeAreaKey ?? null),
  };
  if (payload.isPriority != null) {
    coreUpdate.is_priority = payload.isPriority;
  }

  const { error } = await supabase
    .from('tasks')
    .update(coreUpdate)
    .eq('id', payload.taskId);

  if (error) {
    if (/life_area_key/i.test(error.message)) {
      const { life_area_key: _omit, ...withoutArea } = coreUpdate;
      const { error: retryError } = await supabase
        .from('tasks')
        .update(withoutArea)
        .eq('id', payload.taskId);
      if (retryError) {
        return { ok: false, error: retryError.message };
      }
    } else {
      return { ok: false, error: error.message };
    }
  }

  const metaWrites: Promise<void>[] = [];
  if (payload.effort) {
    metaWrites.push(setTaskEffort(payload.taskId, payload.effort));
  }
  metaWrites.push(setTaskPlanningMeta(payload.taskId, payload.planning));
  await Promise.all(metaWrites);
  return { ok: true };
}

export function effortFromEnergy(energy: VnextEnergyLevel): TaskEffort {
  if (energy === 'low') return 'light';
  if (energy === 'high') return 'heavy';
  return 'medium';
}

export function energyFromEffort(effort: TaskEffort | null): VnextEnergyLevel {
  if (effort === 'light') return 'low';
  if (effort === 'heavy') return 'high';
  return 'normal';
}
