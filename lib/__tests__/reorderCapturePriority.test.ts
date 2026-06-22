import { buildCaptureFronts } from '@/lib/captureProjectFronts';
import {
  reorderCaptureItemsInFront,
  topPriorityCaptureIds,
} from '@/lib/frentes/reorderCapturePriority';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

function item(id: string, content: string, rank: number): EnrichedCaptureItem {
  return {
    id,
    content,
    assignToProject: false,
    selectedCategory: '',
    selectedProjectId: null,
    selectedDate: null,
    effortFeel: null,
    timing: 'later',
    captureRank: rank,
    frontKeyOverride: 'token:app',
  };
}

describe('reorderCapturePriority', () => {
  it('reorders via ordered id list', () => {
    const items = [
      item('a', 'Presentación ONU', 0),
      item('b', 'Y combinator', 10),
    ];

    const next = reorderCaptureItemsInFront(items, ['b', 'a']);
    const { fronts } = buildCaptureFronts(next);
    const appFront = fronts.find((front) => front.key === 'token:app');

    expect(appFront?.tasks.map((task) => task.captureId)).toEqual(['b', 'a']);
  });

  it('marks first item per front as top priority', () => {
    const items = [
      item('a', 'Presentación ONU', 10),
      item('b', 'Y combinator', 0),
      { ...item('c', 'Sacar a Lunita', 0), frontKeyOverride: 'token:casa' },
    ];

    const top = topPriorityCaptureIds(items);
    expect(top.has('b')).toBe(true);
    expect(top.has('c')).toBe(true);
    expect(top.has('a')).toBe(false);
  });
});
