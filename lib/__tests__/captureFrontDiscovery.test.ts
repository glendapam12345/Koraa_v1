import { stripAutoPlanningForDiscovery } from '@/lib/captureFrontDiscovery';
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
  it('strips auto planning but keeps selectedDate for Calendario', () => {
    const stripped = stripAutoPlanningForDiscovery([item('a', 'Terminar app')]);
    expect(stripped[0].selectedDate).toBe('2026-06-20');
    expect(stripped[0].selectedCategory).toBe('');
    expect(stripped[0].effortFeel).toBeNull();
    expect(stripped[0].selectedProjectId).toBeNull();
  });
});
