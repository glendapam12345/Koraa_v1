import type {
  FloatingThoughtCard,
  LifeArea,
  ReorganizeWeekProposal,
  WeekPlannerDay,
  WhatChangedReason,
} from '@/lib/lifeAreas/types';

export const VISION_LIFE_AREAS: LifeArea[] = [
  { id: 'work', name: 'Trabajo', emoji: '💼', color: '#7EB3F0' },
  { id: 'startup', name: 'Startup', emoji: '🚀', color: '#E879A9' },
  { id: 'family', name: 'Familia', emoji: '🧡', color: '#FF8C6B' },
  { id: 'health', name: 'Salud', emoji: '💚', color: '#6BCB9A' },
  { id: 'finance', name: 'Finanzas', emoji: '💜', color: '#B39DDB' },
  { id: 'personal', name: 'Personal', emoji: '✨', color: '#F5C842' },
];

export const VISION_FLOATING_THOUGHTS: FloatingThoughtCard[] = [
  {
    id: 'f1',
    title: 'Preparar pitch ONU',
    areaId: 'work',
    iconEmoji: '🌍',
    layout: { top: 8, left: 12, rotate: '-4deg', zIndex: 4, width: 148 },
  },
  {
    id: 'f2',
    title: 'Pagar tarjeta',
    areaId: 'finance',
    iconEmoji: '💳',
    layout: { top: 52, left: 168, rotate: '5deg', zIndex: 5, width: 132 },
  },
  {
    id: 'f3',
    title: 'Llamar a mamá',
    areaId: 'family',
    iconEmoji: '📞',
    layout: { top: 118, left: 24, rotate: '3deg', zIndex: 3, width: 128 },
  },
  {
    id: 'f4',
    title: 'Ir al gym',
    areaId: 'health',
    iconEmoji: '🏋️',
    layout: { top: 100, left: 178, rotate: '-6deg', zIndex: 6, width: 120 },
  },
  {
    id: 'f5',
    title: 'Revisar presupuesto',
    areaId: 'finance',
    iconEmoji: '📊',
    layout: { top: 188, left: 88, rotate: '-2deg', zIndex: 2, width: 140 },
  },
  {
    id: 'f6',
    title: 'Diseñar hoodie',
    areaId: 'startup',
    iconEmoji: '👕',
    layout: { top: 168, left: 4, rotate: '6deg', zIndex: 7, width: 136 },
  },
  {
    id: 'f7',
    title: 'Comprar despensa',
    areaId: 'personal',
    iconEmoji: '🛒',
    layout: { top: 248, left: 160, rotate: '4deg', zIndex: 1, width: 124 },
  },
];

export const VISION_REORGANIZE_RESULT: ReorganizeWeekProposal = {
  headline: 'Listo. Reorganicé tu semana.',
  subline: 'Puedes ajustar cualquier tarjeta cuando quieras.',
  moved: [
    {
      taskId: 'f1',
      title: 'Preparar pitch ONU',
      areaEmoji: '💼',
      areaColor: '#7EB3F0',
      toLabel: 'jueves',
    },
    {
      taskId: 'f2',
      title: 'Pagar tarjeta',
      areaEmoji: '💜',
      areaColor: '#B39DDB',
      toLabel: 'viernes',
    },
  ],
  kept: [
    { taskId: 'f3', title: 'Llamar a mamá', areaEmoji: '🧡', areaColor: '#FF8C6B' },
    { taskId: 'f4', title: 'Ir al gym', areaEmoji: '💚', areaColor: '#6BCB9A' },
  ],
  freedHoursLabel: '3h',
};

export const VISION_WEEK_DAYS: WeekPlannerDay[] = [
  {
    id: 'wed',
    shortLabel: 'MIÉ 22',
    fullLabel: 'Hoy · Miércoles 22',
    isToday: true,
    summary: '6 tareas · 3h 20m',
    tasks: [
      {
        id: 'w1',
        title: 'Preparar pitch ONU',
        areaId: 'work',
        iconEmoji: '🌍',
        timeLabel: '9:00 AM',
        durationLabel: '90 min',
        status: 'star',
        scheduledDate: 'wed',
      },
      {
        id: 'w2',
        title: 'Llamar a mamá',
        areaId: 'family',
        iconEmoji: '📞',
        timeLabel: '11:00 AM',
        durationLabel: '20 min',
        status: 'pending',
        scheduledDate: 'wed',
      },
      {
        id: 'w3',
        title: 'Ir al gym',
        areaId: 'health',
        iconEmoji: '🏋️',
        timeLabel: '6:00 PM',
        durationLabel: '60 min',
        status: 'pending',
        scheduledDate: 'wed',
      },
    ],
  },
  {
    id: 'thu',
    shortLabel: 'JUE 23',
    fullLabel: 'Jueves 23',
    isToday: false,
    summary: '4 tareas · 2h 10m',
    tasks: [
      {
        id: 'w4',
        title: 'Diseñar hoodie',
        areaId: 'startup',
        iconEmoji: '👕',
        timeLabel: '10:00 AM',
        durationLabel: '45 min',
        status: 'pending',
        scheduledDate: 'thu',
      },
      {
        id: 'w5',
        title: 'Revisar presupuesto',
        areaId: 'finance',
        iconEmoji: '📊',
        timeLabel: '3:00 PM',
        durationLabel: '30 min',
        status: 'pending',
        scheduledDate: 'thu',
      },
    ],
  },
  {
    id: 'fri',
    shortLabel: 'VIE 24',
    fullLabel: 'Viernes 24',
    isToday: false,
    summary: '3 tareas · 1h 45m',
    tasks: [
      {
        id: 'w6',
        title: 'Pagar tarjeta',
        areaId: 'finance',
        iconEmoji: '💳',
        timeLabel: '12:00 PM',
        durationLabel: '15 min',
        status: 'pending',
        scheduledDate: 'fri',
      },
    ],
  },
];

export const WHAT_CHANGED_OPTIONS: WhatChangedReason[] = [
  'new_event',
  'less_time',
  'tired',
  'priorities_changed',
  'more_energy',
];

export function findVisionArea(areas: LifeArea[], id: string): LifeArea | undefined {
  return areas.find((area) => area.id === id);
}

export function areaPastelBg(color: string): string {
  return `${color}33`;
}
