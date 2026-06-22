import {
  extractExplicitDurationMinutes,
  inferEstimatedMinutesFromText,
} from '@/lib/inferTaskEstimatedMinutes';

describe('inferTaskEstimatedMinutes', () => {
  it('reads explicit minutes from text', () => {
    expect(extractExplicitDurationMinutes('Reunión 30 min')).toBe(30);
    expect(extractExplicitDurationMinutes('Bloque 1h 30')).toBe(90);
  });

  it('infers longer blocks for reels and presentations', () => {
    expect(inferEstimatedMinutesFromText('Hacer un reel')).toBe(90);
    expect(inferEstimatedMinutesFromText('Terminar presentación')).toBe(60);
  });

  it('infers quick tasks for calls and emails', () => {
    expect(inferEstimatedMinutesFromText('Marcarle a mamá')).toBe(20);
    expect(inferEstimatedMinutesFromText('Email al cliente')).toBe(20);
  });

  it('falls back to effort defaults', () => {
    expect(inferEstimatedMinutesFromText('Algo genérico', 'light')).toBe(25);
    expect(inferEstimatedMinutesFromText('Algo genérico', 'heavy')).toBe(90);
  });
});
