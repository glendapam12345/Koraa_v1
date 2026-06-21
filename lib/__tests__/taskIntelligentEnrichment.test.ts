import {
  enrichCaptureItem,
  inferTimingBucket,
  inferTimingFromDate,
  dateForTimingBucket,
} from '@/lib/taskIntelligentEnrichment';
import { parseCaptureToInboxItems } from '@/lib/vaciarInboxCapture';
import type { ProjectForMatch } from '@/lib/batchProjectMatch';

describe('taskIntelligentEnrichment', () => {
  const projects: ProjectForMatch[] = [
    { id: 'p-yc', name: 'YC Pitch' },
    { id: 'p-koraa', name: 'Koraa' },
  ];

  it('infers category, project, and timing for business errands', () => {
    const item = enrichCaptureItem(
      {
        id: '1',
        content: 'Preparar pitch YC',
        assignToProject: false,
        selectedCategory: '',
        selectedProjectId: null,
        selectedDate: null,
        effortFeel: null,
      },
      projects,
    );
    expect(item.selectedCategory).toBe('trabajo');
    expect(item.selectedProjectId).toBe('p-yc');
    expect(item.timing).toBe('later');
    expect(item.selectedDate).toBeNull();
    expect(item.effortFeel).toBe('heavy');
  });

  it('suggests today for quick errands', () => {
    const item = enrichCaptureItem(
      {
        id: '2',
        content: 'Comprar comida para perros',
        assignToProject: false,
        selectedCategory: '',
        selectedProjectId: null,
        selectedDate: null,
        effortFeel: null,
      },
      projects,
    );
    expect(item.timing).toBe('today');
    expect(item.selectedDate).toBe(dateForTimingBucket('today'));
  });

  it('suggests today for SAT call even without hoy', () => {
    const item = enrichCaptureItem(
      {
        id: 'sat',
        content: 'Llamar al SAT',
        assignToProject: false,
        selectedCategory: '',
        selectedProjectId: null,
        selectedDate: null,
        effortFeel: null,
      },
      projects,
    );
    expect(item.timing).toBe('today');
    expect(item.selectedDate).toBe(dateForTimingBucket('today'));
    expect(item.effortFeel).toBe('light');
  });

  it('keeps important errands as today, not later', () => {
    expect(inferTimingBucket('Llamar urgente al banco', 'heavy')).toBe('today');
  });

  it('suggests today for client email', () => {
    const item = enrichCaptureItem(
      {
        id: 'email',
        content: 'Email al cliente sobre el contrato',
        assignToProject: false,
        selectedCategory: '',
        selectedProjectId: null,
        selectedDate: null,
        effortFeel: null,
      },
      projects,
    );
    expect(item.timing).toBe('today');
    expect(item.effortFeel).toBe('light');
  });

  it('does not treat proposal email as quick communication', () => {
    expect(inferTimingBucket('Enviar propuesta por email al inversor', 'heavy')).toBe('later');
  });

  it('respects explicit weekday date on deep work', () => {
    const monday = new Date(2026, 5, 15, 9, 0, 0);
    jest.useFakeTimers();
    jest.setSystemTime(monday);
    try {
      const items = parseCaptureToInboxItems('Preparar pitch YC para el viernes', 'es');
      expect(items[0].selectedDate).toBe('2026-06-19');

      const enriched = enrichCaptureItem(items[0], projects);
      expect(enriched.selectedDate).toBe('2026-06-19');
      expect(enriched.timing).toBe(inferTimingFromDate('2026-06-19', monday));
      expect(enriched.timing).toBe('this_week');
    } finally {
      jest.useRealTimers();
    }
  });

  it('matches project name tokens in task text', () => {
    const item = enrichCaptureItem(
      {
        id: '3',
        content: 'Revisar copy de Koraa para App Store',
        assignToProject: false,
        selectedCategory: '',
        selectedProjectId: null,
        selectedDate: null,
        effortFeel: null,
      },
      projects,
    );
    expect(item.selectedProjectId).toBe('p-koraa');
    expect(item.assignToProject).toBe(true);
  });

  it('infers timing buckets from keywords', () => {
    expect(inferTimingBucket('Llamar al SAT hoy', 'light')).toBe('today');
    expect(inferTimingBucket('Llamar al SAT', 'light')).toBe('today');
    expect(inferTimingBucket('Preparar estrategia Q3', 'heavy')).toBe('later');
    expect(inferTimingBucket('Enviar reporte semanal', 'medium')).toBe('this_week');
    expect(inferTimingBucket('Revisar copy de Koraa', 'medium')).toBe('this_week');
  });
});
