import { mergeCaptureReviewEdits } from '@/lib/review/mergeCaptureReviewEdits';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

function item(
  id: string,
  overrides: Partial<EnrichedCaptureItem> = {},
): EnrichedCaptureItem {
  return {
    id,
    content: `Task ${id}`,
    assignToProject: false,
    selectedCategory: 'otros',
    selectedProjectId: null,
    selectedDate: null,
    effortFeel: null,
    timing: 'later',
    ...overrides,
  };
}

describe('mergeCaptureReviewEdits', () => {
  it('preserves manual area moves when AI refine returns fresh rows', () => {
    const previous = [item('a', { lifeAreaKey: 'home', selectedDate: '2026-06-25' })];
    const incoming = [item('a', { lifeAreaKey: 'work' })];

    const merged = mergeCaptureReviewEdits(previous, incoming);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.lifeAreaKey).toBe('home');
    expect(merged[0]?.selectedDate).toBe('2026-06-25');
  });

  it('keeps tasks removed from incoming if user still has them locally', () => {
    const previous = [item('a', { lifeAreaKey: 'home' }), item('b', { lifeAreaKey: 'work' })];
    const incoming = [item('a', { lifeAreaKey: 'work' })];

    const merged = mergeCaptureReviewEdits(previous, incoming);

    expect(merged.map((entry) => entry.id).sort()).toEqual(['a', 'b']);
    expect(merged.find((entry) => entry.id === 'b')?.lifeAreaKey).toBe('work');
  });

  it('preserves cleared preferred time when AI refine returns a suggestion', () => {
    const previous = [item('a', { preferredTime: null, estimatedMinutes: null })];
    const incoming = [item('a', { preferredTime: '09:00', estimatedMinutes: 45 })];

    const merged = mergeCaptureReviewEdits(previous, incoming);

    expect(merged[0]?.preferredTime).toBeNull();
    expect(merged[0]?.estimatedMinutes).toBeNull();
  });

  it('preserves explicit null date when user cleared it', () => {
    const previous = [item('a', { selectedDate: null })];
    const incoming = [item('a', { selectedDate: '2026-08-23' })];

    const merged = mergeCaptureReviewEdits(previous, incoming);

    expect(merged[0]?.selectedDate).toBeNull();
  });
});
