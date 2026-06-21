import { buildCaptureGuidance } from '@/lib/captureReleaseGuidance';
import { enrichCaptureItem } from '@/lib/taskIntelligentEnrichment';
import type { VaciarBatchItem } from '@/lib/vaciarBatchDraft';

function enrich(content: string) {
  const item: VaciarBatchItem = {
    id: `id-${content.slice(0, 8)}`,
    content,
    assignToProject: false,
    selectedCategory: '',
    selectedProjectId: null,
    selectedDate: null,
    effortFeel: null,
  };
  return enrichCaptureItem(item, [{ id: 'p-yc', name: 'YC Pitch' }]);
}

describe('captureReleaseGuidance', () => {
  it('prioritizes pitch as focus and buckets content and wellness separately', () => {
    const items = [
      enrich('Preparar pitch YC'),
      enrich('Subir comercial Impermanence'),
      enrich('Hacer un reel'),
      enrich('No colapsar'),
    ];

    const guidance = buildCaptureGuidance(items);

    expect(guidance.count).toBe(4);
    expect(guidance.focus?.content).toBe('Preparar pitch YC');
    expect(guidance.focus?.reasonKey).toBe('highImpact');
    expect(guidance.later.map((row) => row.content)).toEqual(
      expect.arrayContaining(['Subir comercial Impermanence', 'Hacer un reel']),
    );
    expect(guidance.park.map((row) => row.content)).toContain('No colapsar');
  });

  it('puts wellness-only capture in park without focus', () => {
    const guidance = buildCaptureGuidance([enrich('No colapsar')]);
    expect(guidance.focus).toBeNull();
    expect(guidance.park).toHaveLength(1);
    expect(guidance.later).toHaveLength(0);
  });

  it('gives single actionable task a focus recommendation', () => {
    const guidance = buildCaptureGuidance([enrich('Llamar al SAT')]);
    expect(guidance.focus?.content).toBe('Llamar al SAT');
    expect(guidance.focus?.reasonKey).toBe('quickWin');
  });
});
