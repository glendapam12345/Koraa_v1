import { inferAreaContextLabel } from '@/lib/review/inferAreaContextLabel';

describe('inferAreaContextLabel', () => {
  it('returns home label for household tasks in Spanish', () => {
    expect(
      inferAreaContextLabel(
        [
          { content: 'Lavar ropa y tender' },
          { content: 'Comprar detergente en el super' },
        ],
        'es',
        'Familia',
      ),
    ).toBe('Tareas del hogar');
  });

  it('returns work label for work tasks', () => {
    expect(
      inferAreaContextLabel(
        [
          { content: 'Terminar presentación para el cliente' },
          { content: 'Enviar reporte al equipo' },
        ],
        'es',
        'Trabajo',
      ),
    ).toBe('Del trabajo');
  });

  it('falls back when there is no clear context', () => {
    expect(
      inferAreaContextLabel([{ content: 'revisar pendientes varios' }], 'es', 'Extras'),
    ).toBe('Extras');
  });
});
