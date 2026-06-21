import { buildCaptureFronts } from '@/lib/captureProjectFronts';
import {
  buildReliefReviewModel,
  classifyCaptureFront,
} from '@/lib/captureReliefReview';
import type { EnrichedCaptureItem } from '@/lib/taskIntelligentEnrichment';
import { enrichCaptureItemsLocally } from '@/lib/taskIntelligentEnrichment';

function item(id: string, content: string): EnrichedCaptureItem {
  return {
    id,
    content,
    assignToProject: false,
    selectedCategory: '',
    selectedProjectId: null,
    selectedDate: null,
    effortFeel: null,
    timing: 'later',
  };
}

describe('captureReliefReview', () => {
  it('classifies inferred multi-task fronts as projects', () => {
    const items = [
      item('a', 'Terminar app'),
      item('b', 'Terminar presentación'),
      item('c', 'Ir al gym'),
      item('d', 'Comprar papel'),
    ];
    const enriched = enrichCaptureItemsLocally(items, []);
    const { fronts } = buildCaptureFronts(enriched);
    const koraa = fronts.find((front) => front.name === 'Koraa App');
    const personal = fronts.find((front) => front.name === 'Personal');

    expect(koraa).toBeDefined();
    expect(classifyCaptureFront(koraa!)).toBe('project');

    expect(personal).toBeDefined();
    expect(classifyCaptureFront(personal!)).toBe('lifeArea');
  });

  it('builds relief model with standalone tasks separated', () => {
    const items = [
      item('a', 'Comprar boletos para el cine'),
      item('b', 'Llamar al dentista'),
    ];
    const enriched = enrichCaptureItemsLocally(items, []);
    const model = buildReliefReviewModel(buildCaptureFronts(enriched).fronts);

    expect(model.counts.standalone).toBe(0);
    expect(model.counts.lifeAreas).toBe(1);
    expect(model.counts.projects).toBe(0);
    expect(model.deadlineFronts).toHaveLength(0);
  });

  it('only asks deadlines for projects', () => {
    const items = [
      item('a', 'Terminar app Koraa'),
      item('b', 'Terminar presentación Koraa'),
      item('c', 'Dos tiktoks impermanence'),
      item('d', 'Sudadera impermanence'),
    ];
    const enriched = enrichCaptureItemsLocally(items, []);
    const model = buildReliefReviewModel(buildCaptureFronts(enriched).fronts);

    expect(model.deadlineFronts.length).toBeGreaterThan(0);
    expect(model.deadlineFronts.every((front) => classifyCaptureFront(front) === 'project')).toBe(
      true,
    );
  });
});
