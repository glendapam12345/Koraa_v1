import { buildCaptureFronts } from '@/lib/captureProjectFronts';
import {
  applyAssignmentKind,
  getItemAssignmentKind,
  moveCaptureItemToFrontKey,
} from '@/lib/frentes/captureItemFront';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

function item(
  id: string,
  content: string,
  overrides: Partial<EnrichedCaptureItem> = {},
): EnrichedCaptureItem {
  return {
    id,
    content,
    assignToProject: false,
    selectedCategory: '',
    selectedProjectId: null,
    selectedDate: null,
    effortFeel: null,
    timing: 'later',
    ...overrides,
  };
}

describe('captureItemFront', () => {
  it('moves item to another inferred front via override', () => {
    const items = [
      item('a', 'Comprar boletos para el cine'),
      item('b', 'Terminar última versión de la app'),
    ];

    const moved = moveCaptureItemToFrontKey(items, 'a', 'koraa', []);
    const koraaItem = moved.find((entry) => entry.id === 'a');

    expect(koraaItem?.frontKeyOverride).toBe('koraa');
    const { fronts } = buildCaptureFronts(moved);
    const koraa = fronts.find((front) => front.key === 'koraa');
    expect(koraa?.tasks.map((task) => task.captureId)).toContain('a');
  });

  it('assigns item to existing project', () => {
    const items = [item('a', 'Algo suelto')];
    const next = applyAssignmentKind(items[0], 'existing_project', { projectId: 'proj-1' });

    expect(getItemAssignmentKind(next)).toBe('existing_project');
    expect(next.selectedProjectId).toBe('proj-1');
    expect(next.assignToProject).toBe(true);

    const { fronts } = buildCaptureFronts([next], [
      { id: 'proj-1', name: 'Koraa App', due_date: null },
    ]);
    expect(fronts[0]?.key).toBe('project:proj-1');
  });

  it('marks single item for new project creation', () => {
    const items = [item('a', 'Diseño reel impermanence')];
    const next = applyAssignmentKind(items[0], 'new_project', { frontKey: 'impermanence' });

    expect(next.createProjectOnSave).toBe(true);
    expect(next.frontKeyOverride).toBe('impermanence');

    const { fronts } = buildCaptureFronts([next]);
    expect(fronts[0]?.suggestedNewProject).toBe(true);
  });
});
