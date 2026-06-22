import { buildLiveCapturePreview } from '@/lib/liveCapturePreview';

const CHATGPT_BRAIN_DUMP =
  'Necesito mañana hacer un reel, dos tiktoks en impermanence, un tiktok personal, terminar el diseño de Jaqui para las sudaderas, necesito ver cómo van mis nuevas sudaderas, necesito enviar las nuevas sudaderas, necesito cobrar, comprar los boletos para el cine, terminar la ultima version de la app, terminar la presentacion de la app.';

describe('buildLiveCapturePreview', () => {
  it('returns null for very short input', () => {
    expect(buildLiveCapturePreview('ok', 'es', [])).toBeNull();
  });

  it('builds area chips locally without network', () => {
    const result = buildLiveCapturePreview(CHATGPT_BRAIN_DUMP, 'es', []);
    expect(result).not.toBeNull();
    expect(result!.items.length).toBe(10);
    expect(result!.areaColumns.length).toBeGreaterThanOrEqual(2);
    expect(result!.areaChips.length).toBe(result!.areaColumns.length);
    expect(result!.areaColumns.reduce((sum, col) => sum + col.count, 0)).toBe(result!.items.length);
    expect(result!.areaColumns.every((col) => col.previews.length > 0)).toBe(true);
  });

  it('labels home tasks with contextual copy', () => {
    const result = buildLiveCapturePreview(
      'Lavar la ropa\nComprar leche en el super\nLimpiar la cocina',
      'es',
      [],
    );
    expect(result).not.toBeNull();
    const homeColumn = result!.areaColumns.find((col) => col.label === 'Tareas del hogar');
    expect(homeColumn).toBeTruthy();
    expect(homeColumn!.count).toBe(3);
  });

  it('matches existing projects when provided', () => {
    const projects = [{ id: 'p1', name: 'Mi app' }];
    const result = buildLiveCapturePreview(
      'Terminar la última versión de la app\nArreglar bug en onboarding',
      'es',
      projects,
    );
    expect(result).not.toBeNull();
    const matched = result!.items.find((item) => item.selectedProjectId === 'p1');
    expect(matched).toBeTruthy();
  });

  it('keeps stable ids when stableIds is enabled', () => {
    const text = 'Comprar leche\nLlamar al dentista';
    const first = buildLiveCapturePreview(text, 'es', [], { stableIds: true });
    const second = buildLiveCapturePreview(`${text}\nEnviar email`, 'es', [], {
      stableIds: true,
    });
    expect(first!.items[0].id).toBe(second!.items[0].id);
    expect(first!.items[1].id).toBe(second!.items[1].id);
  });
});
