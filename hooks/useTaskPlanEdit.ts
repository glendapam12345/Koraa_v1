import { useCallback, useState } from 'react';
import type { Task } from '@/components/tasks/TaskCard';
import { saveTaskPlanEdit, type TaskPlanEditPayload } from '@/lib/vnext/saveTaskPlanEdit';

type UseTaskPlanEditOptions = {
  onSaved?: (taskId: string, payload: TaskPlanEditPayload) => void;
  onError?: (message: string) => void;
};

export function useTaskPlanEdit({ onSaved, onError }: UseTaskPlanEditOptions = {}) {
  const [saving, setSaving] = useState(false);

  const savePlan = useCallback(
    async (payload: TaskPlanEditPayload) => {
      setSaving(true);
      try {
        const result = await saveTaskPlanEdit(payload);
        if (!result.ok) {
          onError?.(result.error);
          return false;
        }
        onSaved?.(payload.taskId, payload);
        return true;
      } finally {
        setSaving(false);
      }
    },
    [onError, onSaved],
  );

  return { saving, savePlan };
}

export type { TaskPlanEditPayload };
