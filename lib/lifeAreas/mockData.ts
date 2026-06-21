import type {
  LifeArea,
  ReorganizeWeekProposal,
  TaskLifeCardData,
} from '@/lib/lifeAreas/types';

/** Datos de ejemplo para prototipo visual — no conectados a Supabase. */
export const MOCK_LIFE_AREAS: LifeArea[] = [
  { id: 'work', name: 'Trabajo', emoji: '💙', color: '#4A90E2' },
  { id: 'koraa', name: 'Koraa', emoji: '🩷', color: '#E879A9' },
  { id: 'impermanence', name: 'Impermanence', emoji: '💛', color: '#F5B942' },
  { id: 'health', name: 'Salud', emoji: '💚', color: '#3CB371' },
  { id: 'finance', name: 'Finanzas', emoji: '💜', color: '#9B59B6' },
  { id: 'family', name: 'Familia', emoji: '🧡', color: '#FF8C42' },
];

export const MOCK_TASK_CARDS: TaskLifeCardData[] = [
  {
    id: 't1',
    title: 'Terminar presentación ONU',
    areaId: 'work',
    flexLevel: 'suggested',
    dueDate: '2026-06-19',
  },
  {
    id: 't2',
    title: 'Enviar sudaderas',
    areaId: 'impermanence',
    flexLevel: 'soon',
    dueDate: '2026-06-20',
  },
  {
    id: 't3',
    title: 'Comprar boletos cine',
    areaId: 'family',
    flexLevel: 'flexible',
    dueDate: null,
  },
  {
    id: 't4',
    title: 'Build TestFlight',
    areaId: 'koraa',
    flexLevel: 'suggested',
    dueDate: '2026-06-22',
  },
  {
    id: 't5',
    title: 'Llamar al dentista',
    areaId: 'health',
    flexLevel: 'flexible',
    dueDate: null,
  },
];

export const MOCK_REORGANIZE_PROPOSAL: ReorganizeWeekProposal = {
  headline: 'Tu semana cambió — aquí va una sugerencia',
  subline: 'Puedes aceptar todo, ajustar una tarjeta, o dejarlo como está.',
  moved: [
    {
      taskId: 't1',
      title: 'Terminar presentación ONU',
      areaEmoji: '💙',
      areaColor: '#4A90E2',
      fromLabel: 'miércoles',
      toLabel: 'jueves',
    },
    {
      taskId: 't2',
      title: 'Enviar sudaderas',
      areaEmoji: '💛',
      areaColor: '#F5B942',
      fromLabel: 'jueves',
      toLabel: 'viernes',
    },
  ],
  kept: [
    {
      taskId: 't4',
      title: 'Build TestFlight',
      areaEmoji: '🩷',
      areaColor: '#E879A9',
    },
    {
      taskId: 't3',
      title: 'Comprar boletos cine',
      areaEmoji: '🧡',
      areaColor: '#FF8C42',
    },
  ],
};

export function findLifeArea(areas: LifeArea[], id: string): LifeArea | undefined {
  return areas.find((area) => area.id === id);
}
