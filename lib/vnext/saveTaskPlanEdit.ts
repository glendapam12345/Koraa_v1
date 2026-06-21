import { supabase } from '@/lib/supabase';
import {
  setTaskPlanningMeta,
  type TaskPlanningMeta,
} from '@/lib/taskPlanningMeta';
import { setTaskEffort, type TaskEffort } from '@/lib/taskPerceivedEffort';
import type { VnextEnergyLevel } from '@/lib/vnext/types';

export type TaskPlanEditPayload = {
  taskId: string;
  content: string;
  scheduledDate: string | null;
  projectId: string | null;
  effort: TaskEffort | null;
  planning: TaskPlanningMeta;
};

export async function saveTaskPlanEdit(
  payload: TaskPlanEditPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from('tasks')
    .update({
      content: payload.content.trim(),
      scheduled_date: payload.scheduledDate,
      project_id: payload.projectId,
    })
    .eq('id', payload.taskId);

  if (error) {
    return { ok: false, error: error.message };
  }

  if (payload.effort) {
    await setTaskEffort(payload.taskId, payload.effort);
  }

  await setTaskPlanningMeta(payload.taskId, payload.planning);
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
