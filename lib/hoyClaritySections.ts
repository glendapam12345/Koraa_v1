import type { Task } from '@/hooks/useTasks';
import { HOY_DEFAULT_FOCUS_LIMIT } from '@/lib/hoyFocusTasks';

export type HoyClaritySections = {
  /** Máx. 1 paso sugerido visible como foco (el resto puede esperar). */
  importantToday: Task[];
  /** @deprecated No se listan en Hoy — usar restCount. */
  couldAdvance: Task[];
  /** @deprecated No se listan en Hoy — usar restCount. */
  canWait: Task[];
  /** Pendientes que no están en el plan de hoy. */
  restCount: number;
};

/**
 * Plan de Hoy: solo el foco principal (máx. 1).
 * El inventario completo vive en Tareas — no se reparte en listas largas aquí.
 */
export function buildHoyClaritySections(
  incompleteTasks: Task[],
  focusTaskIds: Set<string>,
  maxSteps: number = HOY_DEFAULT_FOCUS_LIMIT,
): HoyClaritySections {
  const parents = incompleteTasks.filter((t) => !t.parent_task_id);

  const importantToday = parents
    .filter((task) => focusTaskIds.has(task.id))
    .sort((a, b) => {
      if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1;
      return 0;
    })
    .slice(0, maxSteps);

  const restCount = parents.length - importantToday.length;

  return {
    importantToday,
    couldAdvance: [],
    canWait: [],
    restCount: Math.max(0, restCount),
  };
}
