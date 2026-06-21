import {
  assignSuggestedProjects,
  matchProjectForTask,
} from '@/lib/batchProjectMatch';
import { captureResultToBatchItems } from '@/lib/vaciarBatchDraft';
import type { TaskCaptureResult } from '@/lib/taskCaptureTypes';

describe('batchProjectMatch', () => {
  const projects = [
    { id: 'p1', name: 'Boda' },
    { id: 'p2', name: 'Trabajo Q2' },
    { id: 'p3', name: 'Salud' },
  ];

  it('matches when project name appears in task text', () => {
    expect(matchProjectForTask('Comprar regalo para la boda', projects)).toBe('p1');
    expect(matchProjectForTask('Revisar informe trabajo q2', projects)).toBe('p2');
  });

  it('returns null when no clear match', () => {
    expect(matchProjectForTask('Llamar al dentista', projects)).toBeNull();
    expect(matchProjectForTask('', projects)).toBeNull();
  });

  it('prefers longer / stronger match', () => {
    const many = [
      { id: 'short', name: 'Casa' },
      { id: 'long', name: 'Renovación casa' },
    ];
    expect(matchProjectForTask('Pintar paredes renovación casa', many)).toBe('long');
  });

  it('assigns projects only to steps without one', () => {
    const capture: TaskCaptureResult = {
      summary: 'Lista',
      fromAi: false,
      main_task: {
        content: 'Comprar regalo boda',
        scheduled_date: null,
        project_id: 'p1',
      },
      prep_steps: [{ content: 'Llamar dentista', scheduled_date: null }],
    };
    const items = captureResultToBatchItems(capture);
    const withSuggestions = assignSuggestedProjects(items, projects);

    expect(withSuggestions[0].selectedProjectId).toBe('p1');
    expect(withSuggestions[1].selectedProjectId).toBeNull();
  });
});
