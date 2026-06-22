import { sanitizeCaptureItemsForSave } from '@/lib/review/sanitizeCaptureItemsForSave';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

function item(partial: Partial<EnrichedCaptureItem> = {}): EnrichedCaptureItem {
  return {
    id: '1',
    content: 'Tarea',
    selectedCategory: '',
    selectedDate: null,
    effortFeel: null,
    assignToProject: false,
    selectedProjectId: null,
    timing: 'later',
    ...partial,
  };
}

describe('sanitizeCaptureItemsForSave', () => {
  it('clears assignToProject when project id is missing', () => {
    const result = sanitizeCaptureItemsForSave([
      item({ assignToProject: true, selectedProjectId: null }),
    ]);
    expect(result[0].assignToProject).toBe(false);
    expect(result[0].selectedProjectId).toBeNull();
  });

  it('keeps valid project assignments', () => {
    const result = sanitizeCaptureItemsForSave([
      item({ assignToProject: true, selectedProjectId: 'project-1' }),
    ]);
    expect(result[0].assignToProject).toBe(true);
    expect(result[0].selectedProjectId).toBe('project-1');
  });
});
