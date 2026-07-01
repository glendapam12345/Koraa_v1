import { buildPreviewTaskSummaryParts } from '@/lib/review/previewTaskSummary';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

const t = (key: string) => key;

const baseItem: EnrichedCaptureItem = {
  id: '1',
  content: 'Test task',
  assignToProject: false,
  selectedCategory: 'personal',
  selectedProjectId: null,
  selectedDate: null,
  effortFeel: null,
  estimatedMinutes: null,
  preferredTime: null,
  timing: 'later',
  markImportant: false,
  capturePriority: null,
};

describe('buildPreviewTaskSummaryParts', () => {
  it('marks all fields missing when empty', () => {
    const parts = buildPreviewTaskSummaryParts(baseItem, 'es', t);
    expect(parts).toHaveLength(4);
    expect(parts.every((part) => !part.filled)).toBe(true);
  });

  it('marks filled fields when values exist', () => {
    const parts = buildPreviewTaskSummaryParts(
      {
        ...baseItem,
        selectedDate: '2026-06-22',
        estimatedMinutes: 30,
        preferredTime: '09:00',
        capturePriority: 'high',
      },
      'es',
      t,
    );

    expect(parts.filter((part) => part.filled)).toHaveLength(4);
  });
});
