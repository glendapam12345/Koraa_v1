/** Ordena tareas según el plan del cerebro Koraa (IDs desconocidos al final). */
export function orderTasksByFocusIds<T extends { id: string }>(
  tasks: T[],
  focusIds: string[],
): T[] {
  if (focusIds.length === 0) return tasks;

  const rank = new Map(focusIds.map((id, index) => [id, index]));
  return [...tasks].sort((a, b) => {
    const rankA = rank.get(a.id) ?? 999;
    const rankB = rank.get(b.id) ?? 999;
    if (rankA !== rankB) return rankA - rankB;
    return 0;
  });
}
