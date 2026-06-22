import { inferGroupContextHint } from '@/lib/review/inferGroupContextHint';

describe('inferGroupContextHint', () => {
  it('detects work context from task text', () => {
    expect(
      inferGroupContextHint([
        { content: 'Terminar presentación para el cliente' },
        { content: 'Enviar reporte al equipo' },
      ]),
    ).toBe('work');
  });

  it('detects home context', () => {
    expect(
      inferGroupContextHint([
        { content: 'Lavar ropa y tender' },
        { content: 'Comprar detergente en el super' },
      ]),
    ).toBe('home');
  });

  it('detects venture context over generic work', () => {
    expect(
      inferGroupContextHint([
        { content: 'Grabar reel para la tienda online' },
        { content: 'Pedir telas para la nueva colección' },
      ]),
    ).toBe('venture');
  });

  it('detects personal context', () => {
    expect(
      inferGroupContextHint([
        { content: 'Comprar regalo de cumpleaños para mamá' },
        { content: 'Reservar boletos de cine con amigos' },
      ]),
    ).toBe('personal');
  });

  it('returns null when there are no context signals', () => {
    expect(inferGroupContextHint([{ content: 'revisar pendientes varios' }])).toBeNull();
  });
});
