import { parseCaptureToInboxItems } from '@/lib/vaciarInboxCapture';
import { enrichCaptureItem, enrichCaptureItemsLocally } from '@/lib/taskIntelligentEnrichment';
import { buildCaptureFronts } from '@/lib/captureProjectFronts';
import type { VaciarBatchItem } from '@/lib/vaciarBatchDraft';

const CHATGPT_BRAIN_DUMP =
  'Necesito mañana hacer un reel, dos tiktoks en impermanence, un tiktok personal, terminar el diseño de Jaqui para las sudaderas, necesito ver cómo van mis nuevas sudaderas, necesito enviar las nuevas sudaderas, necesito cobrar, comprar los boletos para el cine, terminar la ultima version de la app, terminar la presentacion de la app.';

function enrich(content: string, index: number) {
  const item: VaciarBatchItem = {
    id: `id-${index}-${content.slice(0, 8)}`,
    content,
    assignToProject: false,
    selectedCategory: '',
    selectedProjectId: null,
    selectedDate: null,
    effortFeel: null,
  };
  return enrichCaptureItem(item, []);
}

describe('captureProjectFronts', () => {
  it('clusters a messy capture into open fronts, not task count', () => {
    const items = [
      enrich('Terminar última versión de la app', 0),
      enrich('Terminar presentación de la app', 1),
      enrich('Crear un reel', 2),
      enrich('Crear 2 TikToks', 3),
      enrich('Revisar producción de hoodies', 4),
      enrich('Enviar hoodies', 5),
      enrich('Cobrar', 6),
      enrich('Comprar boletos para el cine', 7),
    ];

    const result = buildCaptureFronts(items);

    expect(result.taskCount).toBe(8);
    expect(result.frontCount).toBeGreaterThanOrEqual(3);
    expect(result.frontCount).toBeLessThan(result.taskCount);

    const koraa = result.fronts.find((front) => front.name === 'Koraa App');
    const impermanence = result.fronts.find((front) => front.name === 'Impermanence');
    expect(koraa?.tasks.length).toBeGreaterThanOrEqual(2);
    expect(impermanence?.tasks.length).toBeGreaterThanOrEqual(3);
    expect(impermanence?.suggestedNewProject).toBe(true);
    expect(result.quickSummary.taskCount).toBe(8);
    expect(result.quickSummary.projectCount).toBeGreaterThanOrEqual(3);
  });

  it('suggests creating a project for multi-task inferred fronts', () => {
    const items = [
      enrich('Diseño propuesta maratón', 0),
      enrich('Preparar muestras para maratón', 1),
      enrich('Reunión estrategia CONADE', 2),
    ];
    const result = buildCaptureFronts(items);
    const marathon = result.fronts.find((front) => front.name === 'Maratón');
    expect(marathon?.suggestedNewProject).toBe(true);
    expect(marathon?.tasks.length).toBe(3);
  });

  it('does not show two Personal cards for cine + misc personal tasks', () => {
    const items = [
      enrich('Ir al cine comprar croquetas Luna', 0),
      enrich('Hacer mi contenido', 1),
    ];
    const result = buildCaptureFronts(items);
    const personalCards = result.fronts.filter((front) => front.name === 'Personal');
    expect(personalCards).toHaveLength(1);
    expect(personalCards[0]?.tasks.length).toBe(2);
  });

  it('clusters the ChatGPT brain dump like the product mockup', () => {
    const parsed = parseCaptureToInboxItems(CHATGPT_BRAIN_DUMP, 'es');
    expect(parsed.length).toBe(10);

    const enriched = enrichCaptureItemsLocally(parsed, []);
    const result = buildCaptureFronts(enriched);

    expect(result.frontCount).toBe(3);
    const koraa = result.fronts.find((front) => front.name === 'Koraa App');
    const impermanence = result.fronts.find((front) => front.name === 'Impermanence');
    const personal = result.fronts.find((front) => front.name === 'Personal');

    expect(koraa?.tasks.length).toBe(2);
    expect(impermanence?.tasks.length).toBe(6);
    expect(personal?.tasks.length).toBe(2);
    expect(impermanence?.hints).toContain('important');
    expect(koraa?.hints.length).toBeGreaterThan(0);
    expect(personal?.tasks.map((task) => task.content)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/tiktok personal/i),
        expect.stringMatching(/cine/i),
      ]),
    );
    expect(impermanence?.tasks.map((task) => task.content)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/reel/i),
        expect.stringMatching(/sudaderas/i),
        expect.stringMatching(/cobrar/i),
      ]),
    );
  });
});
