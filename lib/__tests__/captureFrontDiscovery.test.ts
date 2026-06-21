import {
  applyFrontDeadlinesToItems,
  stripAutoPlanningForDiscovery,
} from '@/lib/captureFrontDiscovery';
import { buildCaptureFronts } from '@/lib/captureProjectFronts';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';

function item(id: string, content: string): EnrichedCaptureItem {
  return {
    id,
    content,
    assignToProject: false,
    selectedCategory: 'trabajo',
    selectedProjectId: 'p1',
    selectedDate: '2026-06-20',
    effortFeel: 'heavy',
    timing: 'today',
  };
}

describe('captureFrontDiscovery', () => {
  it('strips auto planning fields for discovery preview', () => {
    const stripped = stripAutoPlanningForDiscovery([item('a', 'Terminar app')]);
    expect(stripped[0].selectedDate).toBeNull();
    expect(stripped[0].selectedCategory).toBe('');
    expect(stripped[0].effortFeel).toBeNull();
    expect(stripped[0].selectedProjectId).toBeNull();
  });

  it('applies front deadlines only when user sets them', () => {
    const items = [item('a', 'Terminar app'), item('b', 'Comprar boletos')];
    const { fronts } = buildCaptureFronts(items);
    const withDate = applyFrontDeadlinesToItems(items, fronts, {
      [fronts[0].key]: '2026-07-01',
    });
    const firstFrontIds = new Set(fronts[0].tasks.map((task) => task.captureId));
    expect(withDate.find((entry) => firstFrontIds.has(entry.id))?.selectedDate).toBe('2026-07-01');
    expect(withDate.find((entry) => !firstFrontIds.has(entry.id))?.selectedDate).toBeNull();
  });
});
