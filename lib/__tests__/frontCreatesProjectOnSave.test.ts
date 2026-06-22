import { frontCreatesProjectOnSave } from '@/lib/review/frontCreatesProjectOnSave';
import type { CaptureFront } from '@/lib/captureProjectFronts';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

describe('frontCreatesProjectOnSave', () => {
  const front = (tasks: string[]): CaptureFront => ({
    key: 'token:test',
    name: 'Test',
    emoji: '🌿',
    projectId: null,
    isExistingProject: false,
    suggestedNewProject: false,
    tasks: tasks.map((id) => ({ captureId: id, content: 'x' })),
    hints: [],
  });

  const item = (id: string, createProjectOnSave = false): EnrichedCaptureItem => ({
    id,
    content: 'Task',
    assignToProject: false,
    selectedCategory: '',
    selectedProjectId: null,
    selectedDate: null,
    effortFeel: null,
    timing: 'later',
    createProjectOnSave,
  });

  it('returns true when user marked group as project', () => {
    expect(frontCreatesProjectOnSave(front(['a']), [item('a', true)])).toBe(true);
  });

  it('returns false for existing project fronts', () => {
    const existing = { ...front(['a']), projectId: 'p1', isExistingProject: true };
    expect(frontCreatesProjectOnSave(existing, [item('a', true)])).toBe(false);
  });
});
