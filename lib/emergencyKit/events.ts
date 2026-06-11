import type { EmergencyKitEventId, EmergencyKitModuleId } from './types';

export type EmergencyKitEventOption = {
  id: EmergencyKitEventId;
  emoji: string;
  crisis: boolean;
};

export const EMERGENCY_KIT_EVENTS: EmergencyKitEventOption[] = [
  { id: 'breakup', emoji: '💔', crisis: true },
  { id: 'pet_loss', emoji: '🐶', crisis: true },
  { id: 'job_loss', emoji: '💼', crisis: true },
  { id: 'anxiety', emoji: '😰', crisis: true },
  { id: 'burnout', emoji: '🔥', crisis: true },
  { id: 'sadness', emoji: '😔', crisis: false },
  { id: 'family', emoji: '👨‍👩‍👧', crisis: false },
  { id: 'transition', emoji: '🌎', crisis: false },
  { id: 'other', emoji: '✍️', crisis: false },
];

const MODULE_PRIORITY: Record<EmergencyKitEventId, EmergencyKitModuleId[]> = {
  breakup: ['music', 'shows', 'support_circle', 'letters', 'movies', 'books', 'internet', 'places', 'memory_box'],
  pet_loss: ['memory_box', 'letters', 'support_circle', 'music', 'movies', 'shows', 'books', 'internet', 'places'],
  job_loss: ['letters', 'support_circle', 'books', 'music', 'movies', 'shows', 'internet', 'places', 'memory_box'],
  anxiety: ['music', 'shows', 'places', 'letters', 'support_circle', 'movies', 'books', 'internet', 'memory_box'],
  burnout: ['music', 'shows', 'places', 'letters', 'movies', 'books', 'internet', 'support_circle', 'memory_box'],
  sadness: ['music', 'letters', 'support_circle', 'shows', 'movies', 'memory_box', 'books', 'internet', 'places'],
  family: ['letters', 'support_circle', 'music', 'shows', 'books', 'movies', 'internet', 'places', 'memory_box'],
  transition: ['letters', 'support_circle', 'music', 'books', 'shows', 'movies', 'places', 'internet', 'memory_box'],
  other: ['music', 'letters', 'support_circle', 'shows', 'movies', 'books', 'internet', 'places', 'memory_box'],
};

export function isCrisisEvent(eventId: EmergencyKitEventId, customText?: string): boolean {
  const event = EMERGENCY_KIT_EVENTS.find((e) => e.id === eventId);
  if (event?.crisis) return true;
  if (!customText) return false;
  const lower = customText.toLowerCase();
  const crisisWords = [
    'panic',
    'pánico',
    'grief',
    'duelo',
    'died',
    'murió',
    'fired',
    'desped',
    'breakup',
    'ruptura',
    'overwhelmed',
    'abrumad',
  ];
  return crisisWords.some((w) => lower.includes(w));
}

export function getDefaultModulePriority(eventId: EmergencyKitEventId): EmergencyKitModuleId[] {
  return MODULE_PRIORITY[eventId] ?? MODULE_PRIORITY.other;
}
