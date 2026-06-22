import { buildFrentesDashboard } from '@/lib/vnext/buildFrentesDashboard';
import type { Task } from '@/components/tasks/TaskCard';

function task(
  id: string,
  content: string,
  opts: Partial<Task> = {},
): Task {
  return {
    id,
    content,
    is_completed: false,
    is_priority: false,
    category: 'otros',
    completed_at: null,
    created_at: '2026-06-16T10:00:00Z',
    parent_task_id: null,
    ...opts,
  };
}

describe('buildFrentesDashboard', () => {
  it('groups open tasks by project and inferred fronts', () => {
    const projects = [
      { id: 'p1', name: 'Koraa App', color: '#7C5CE0', due_date: null },
      { id: 'p2', name: 'Impermanence', color: '#D976A8', due_date: null },
    ];
    const tasks = [
      task('a', 'Terminar app', { project_id: 'p1' }),
      task('b', 'Grabar reel', { project_id: 'p2' }),
      task('c', 'Llamar a mamá'),
    ];

    const dashboard = buildFrentesDashboard(tasks, projects, '2026-06-16');

    expect(dashboard.fronts.length).toBeGreaterThanOrEqual(2);
    expect(dashboard.totalOpenTasks).toBe(3);
    const koraa = dashboard.fronts.find((front) => front.projectId === 'p1');
    expect(koraa?.openTaskCount).toBe(1);
    expect(koraa?.emoji).toBe('📁');
  });

  it('builds weekly insight bars from week activity', () => {
    const projects = [{ id: 'p1', name: 'Koraa App', color: '#7C5CE0', due_date: null }];
    const tasks = [
      task('a', 'Ship feature', { project_id: 'p1', scheduled_date: '2026-06-16' }),
      task('b', 'Another feature', { project_id: 'p1', scheduled_date: '2026-06-17' }),
    ];

    const dashboard = buildFrentesDashboard(tasks, projects, '2026-06-16');
    expect(dashboard.weekInsight.length).toBeGreaterThan(0);
    expect(dashboard.weekInsight[0]?.percent).toBeGreaterThan(0);
  });
});
