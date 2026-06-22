import { parseCaptureToInboxItems } from '@/lib/vaciarInboxCapture';
import { enrichCaptureItem, enrichCaptureItemsLocally } from '@/lib/taskIntelligentEnrichment';
import { buildCaptureFronts, suggestGroupNameFromTasks } from '@/lib/captureProjectFronts';
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

function tasksInFrontMatching(result: ReturnType<typeof buildCaptureFronts>, needle: RegExp) {
  return result.fronts.find(
    (front) =>
      needle.test(front.name) || front.tasks.some((task) => needle.test(task.content)),
  );
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

    const appGroup = tasksInFrontMatching(result, /app|versión|presentación|móvil|movil/i);
    const hoodiesGroup = tasksInFrontMatching(result, /hoodie|sudadera/i);
    const reelGroup = tasksInFrontMatching(result, /reel|tiktok/i);
    expect(appGroup?.tasks.length).toBeGreaterThanOrEqual(2);
    expect(hoodiesGroup?.tasks.length).toBeGreaterThanOrEqual(2);
    expect(reelGroup?.tasks.length).toBeGreaterThanOrEqual(1);
    expect(result.quickSummary.taskCount).toBe(8);
    expect(result.frontCount).toBeGreaterThanOrEqual(2);
  });

  it('suggests creating a project for multi-task inferred fronts', () => {
    const items = [
      enrich('Diseño propuesta maratón', 0),
      enrich('Preparar muestras para maratón', 1),
      enrich('Reunión estrategia CONADE', 2),
    ];
    const result = buildCaptureFronts(items);
    const marathon = tasksInFrontMatching(result, /marat/i);
    expect(marathon?.suggestedNewProject).toBe(true);
    expect(marathon?.tasks.length).toBe(2);
  });

  it('keeps unrelated single tasks as standalone groups', () => {
    const items = [
      enrich('Ir al cine comprar croquetas Luna', 0),
      enrich('Hacer mi contenido', 1),
    ];
    const result = buildCaptureFronts(items);
    expect(result.frontCount).toBeGreaterThanOrEqual(1);
    expect(result.taskCount).toBe(2);
  });

  it('clusters the ChatGPT brain dump into a few project-sized groups', () => {
    const parsed = parseCaptureToInboxItems(CHATGPT_BRAIN_DUMP, 'es');
    expect(parsed.length).toBe(10);

    const enriched = enrichCaptureItemsLocally(parsed, []);
    const result = buildCaptureFronts(enriched);

    expect(result.frontCount).toBeGreaterThanOrEqual(3);
    expect(result.frontCount).toBeLessThan(result.taskCount);

    const appGroup = result.fronts.find((front) =>
      front.tasks.some((task) => /app|presentacion|version/i.test(task.content)),
    );
    const sudaderasGroup = result.fronts.find((front) =>
      front.tasks.some((task) => /sudaderas|reel|tiktok|cobrar/i.test(task.content)),
    );
    const cineGroup = result.fronts.find((front) =>
      front.tasks.some((task) => /cine|personal/i.test(task.content)),
    );

    expect(appGroup?.tasks.length).toBeGreaterThanOrEqual(2);
    expect(sudaderasGroup?.tasks.length).toBeGreaterThanOrEqual(3);
    expect(cineGroup?.tasks.length).toBeGreaterThanOrEqual(1);
  });

  it('uses existing project names when the user already saved them', () => {
    const items = [
      enrich('Terminar última versión de la app', 0),
      enrich('Dos tiktoks impermanence', 1),
    ];
    const result = buildCaptureFronts(items, [
      { id: 'p1', name: 'Mi marca', due_date: null },
    ]);
    const saved = result.fronts.find((front) => front.projectId === 'p1');
    expect(saved?.name).toBe('Mi marca');
    expect(saved?.isExistingProject).toBe(true);
  });

  it('suggests readable names from task text when no saved project exists', () => {
    const name = suggestGroupNameFromTasks([
      { captureId: '1', content: 'Enviar sudaderas nuevas' },
      { captureId: '2', content: 'Revisar sudaderas Jaqui' },
    ]);
    expect(name.toLowerCase()).toContain('sudaderas');
  });

  it('never uses hardcoded brand front keys', () => {
    const items = [
      enrich('Terminar última versión de la app', 0),
      enrich('Sudaderas impermanence', 1),
    ];
    const result = buildCaptureFronts(items);
    const keys = result.fronts.map((front) => front.key);
    expect(keys).not.toContain('koraa');
    expect(keys).not.toContain('impermanence');
  });
});
