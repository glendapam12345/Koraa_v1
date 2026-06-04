import { Share } from 'react-native';
import type { Task } from '@/hooks/useTasks';

export function buildTasksCsv(
  tasks: Array<Pick<Task, 'content' | 'scheduled_date' | 'is_completed' | 'category'>>,
): string {
  const header = 'fecha,estado,categoria,tarea';
  const rows = tasks.map((t) => {
    const date = t.scheduled_date ?? '';
    const status = t.is_completed ? 'hecha' : 'pendiente';
    const category = (t.category ?? '').replace(/"/g, '""');
    const content = t.content.replace(/"/g, '""');
    return `"${date}","${status}","${category}","${content}"`;
  });
  return [header, ...rows].join('\n');
}

export async function shareTasksCsv(
  tasks: Array<Pick<Task, 'content' | 'scheduled_date' | 'is_completed' | 'category'>>,
  title: string,
): Promise<boolean> {
  if (tasks.length === 0) return false;
  const csv = buildTasksCsv(tasks);
  try {
    await Share.share({ message: csv, title });
    return true;
  } catch {
    return false;
  }
}
