export type OpenTaskForHoyStep = {
  id: string;
  content: string;
  is_completed?: boolean;
  is_priority?: boolean;
  scheduled_date?: string | null;
  parent_task_id?: string | null;
};

/** El paso más liviano: menos texto ≈ más fácil de cerrar el día 1. */
export function pickLightestOpenTask<T extends OpenTaskForHoyStep>(tasks: T[]): T | null {
  const open = tasks.filter((task) => !task.is_completed && !task.parent_task_id);
  if (open.length === 0) return null;
  return open.reduce((best, task) =>
    task.content.trim().length < best.content.trim().length ? task : best,
  );
}
