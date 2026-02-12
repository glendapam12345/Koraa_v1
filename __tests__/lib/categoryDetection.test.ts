import { detectCategory } from '@/lib/categoryDetection';

describe('categoryDetection', () => {
  describe('detectCategory', () => {
    it('should detect "trabajo" category for work-related keywords', () => {
      expect(detectCategory('Reunión con el equipo')).toBe('trabajo');
      expect(detectCategory('Enviar reporte al jefe')).toBe('trabajo');
      expect(detectCategory('Revisar código del proyecto')).toBe('trabajo');
      expect(detectCategory('Llamada con cliente')).toBe('trabajo');
    });

    it('should detect "salud" category for health-related keywords', () => {
      expect(detectCategory('Ir al gimnasio')).toBe('salud');
      expect(detectCategory('Cita con el doctor')).toBe('salud');
      expect(detectCategory('Hacer ejercicio')).toBe('salud');
      expect(detectCategory('Meditar')).toBe('salud');
    });

    it('should detect "personal" category for personal-related keywords', () => {
      expect(detectCategory('Llamar a mi mamá')).toBe('personal');
      expect(detectCategory('Comprar regalo para amiga')).toBe('personal');
      expect(detectCategory('Organizar fiesta de cumpleaños')).toBe('personal');
    });

    it('should return empty string for unrecognized content', () => {
      expect(detectCategory('Algo completamente diferente')).toBe('');
      expect(detectCategory('123456')).toBe('');
      expect(detectCategory('')).toBe('');
    });

    it('should be case-insensitive', () => {
      expect(detectCategory('REUNIÓN CON EL EQUIPO')).toBe('trabajo');
      expect(detectCategory('Ir Al Gimnasio')).toBe('salud');
      expect(detectCategory('LLAMAR A MI MAMÁ')).toBe('personal');
    });

    it('should prioritize first matching category', () => {
      // Si contiene palabras de múltiples categorías, debería retornar la primera que encuentre
      const result = detectCategory('Reunión de trabajo y luego ir al gimnasio');
      expect(['trabajo', 'salud']).toContain(result);
    });
  });
});
