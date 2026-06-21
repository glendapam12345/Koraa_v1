import { buildLiveCapturePreview } from '@/lib/liveCapturePreview';

const CHATGPT_BRAIN_DUMP =
  'Necesito mañana hacer un reel, dos tiktoks en impermanence, un tiktok personal, terminar el diseño de Jaqui para las sudaderas, necesito ver cómo van mis nuevas sudaderas, necesito enviar las nuevas sudaderas, necesito cobrar, comprar los boletos para el cine, terminar la ultima version de la app, terminar la presentacion de la app.';

describe('buildLiveCapturePreview', () => {
  it('returns null for very short input', () => {
    expect(buildLiveCapturePreview('ok', 'es', [])).toBeNull();
  });

  it('builds fronts locally without network', () => {
    const result = buildLiveCapturePreview(CHATGPT_BRAIN_DUMP, 'es', []);
    expect(result).not.toBeNull();
    expect(result!.items.length).toBe(10);
    expect(result!.fronts.frontCount).toBe(3);
    expect(result!.fronts.fronts.map((f) => f.name)).toEqual(
      expect.arrayContaining(['Koraa App', 'Impermanence', 'Personal']),
    );
  });

  it('matches existing projects when provided', () => {
    const projects = [{ id: 'p1', name: 'Koraa App' }];
    const result = buildLiveCapturePreview(
      'Terminar la última versión de la app\nArreglar bug en onboarding',
      'es',
      projects,
    );
    expect(result).not.toBeNull();
    const koraaFront = result!.fronts.fronts.find((f) => f.name === 'Koraa App');
    expect(koraaFront?.projectId).toBe('p1');
  });

  it('keeps stable ids when stableIds is enabled', () => {
    const text = 'Comprar leche\nLlamar al dentista';
    const first = buildLiveCapturePreview(text, 'es', [], { stableIds: true });
    const second = buildLiveCapturePreview(`${text}\nEnviar email`, 'es', [], {
      stableIds: true,
    });
    expect(first!.items[0].id).toBe(second!.items[0].id);
    expect(first!.items[1].id).toBe(second!.items[1].id);
    expect(second!.items).toHaveLength(3);
  });
});
