import { getDefaultModulePriority, isCrisisEvent } from './events';
import type {
  EmergencyKitAiResponse,
  EmergencyKitEventId,
  EmergencyKitSessionPayload,
} from './types';

const EVENT_LABELS_ES: Record<EmergencyKitEventId, string> = {
  breakup: 'una ruptura',
  pet_loss: 'la pérdida de tu mascota',
  job_loss: 'perder el trabajo',
  anxiety: 'ansiedad',
  burnout: 'agotamiento',
  sadness: 'tristeza',
  family: 'conflictos familiares',
  transition: 'un gran cambio de vida',
  other: 'algo difícil',
};

const EVENT_LABELS_EN: Record<EmergencyKitEventId, string> = {
  breakup: 'a breakup',
  pet_loss: 'losing your pet',
  job_loss: 'job loss',
  anxiety: 'anxiety',
  burnout: 'burnout',
  sadness: 'sadness',
  family: 'family conflict',
  transition: 'a major life transition',
  other: 'something difficult',
};

const ACTIONS_ES: Record<EmergencyKitEventId, string[]> = {
  breakup: [
    'Beber un vaso de agua',
    'Escuchar una playlist que te abrace',
    'Ver un episodio de confort',
    'Escribir lo que sientes, sin editar',
    'Descansar sin culpa',
  ],
  pet_loss: [
    'Mirar una foto que te haga sonreír',
    'Llorar si lo necesitas',
    'Dar un paseo corto',
    'Hablar con alguien de confianza',
    'Descansar',
  ],
  job_loss: [
    'Respirar profundo tres veces',
    'Escribir tres cosas que sí lograste',
    'Llamar a alguien de tu círculo',
    'Dar un paseo',
    'Descansar hoy sin planear el futuro',
  ],
  anxiety: [
    'Beber agua',
    'Caminar cinco minutos',
    'Poner música calmada',
    'Apoyar los pies en el suelo y respirar',
    'Descansar',
  ],
  burnout: [
    'Cerrar los ojos cinco minutos',
    'Beber agua',
    'No hacer nada productivo por un rato',
    'Escuchar algo suave',
    'Acostarte temprano si puedes',
  ],
  sadness: [
    'Abrazarte o taparte con una manta',
    'Beber algo caliente',
    'Escribir una carta a ti misma',
    'Llamar a alguien de confianza',
    'Descansar',
  ],
  family: [
    'Escribir lo que sientes sin enviarlo',
    'Salir a caminar',
    'Escuchar música de confort',
    'Hablar con alguien neutral',
    'Descansar',
  ],
  transition: [
    'Respirar y nombrar una emoción',
    'Dar un paseo corto',
    'Leer una carta que escribiste',
    'Beber agua',
    'Descansar',
  ],
  other: [
    'Beber agua',
    'Dar un paseo corto',
    'Escuchar algo que te calme',
    'Escribir tres líneas sin juzgar',
    'Descansar',
  ],
};

const ACTIONS_EN: Record<EmergencyKitEventId, string[]> = {
  breakup: [
    'Drink a glass of water',
    'Listen to a comforting playlist',
    'Watch one comfort episode',
    'Write what you feel, unedited',
    'Rest without guilt',
  ],
  pet_loss: [
    'Look at a photo that makes you smile',
    'Cry if you need to',
    'Take a short walk',
    'Talk to someone you trust',
    'Rest',
  ],
  job_loss: [
    'Take three deep breaths',
    'Write three things you did accomplish',
    'Call someone in your support circle',
    'Take a walk',
    'Rest today without planning the future',
  ],
  anxiety: [
    'Drink water',
    'Walk for five minutes',
    'Play calming music',
    'Feel your feet on the ground and breathe',
    'Rest',
  ],
  burnout: [
    'Close your eyes for five minutes',
    'Drink water',
    'Do nothing productive for a while',
    'Listen to something soft',
    'Go to bed early if you can',
  ],
  sadness: [
    'Wrap yourself in a blanket',
    'Drink something warm',
    'Write a letter to yourself',
    'Call someone you trust',
    'Rest',
  ],
  family: [
    'Write what you feel without sending it',
    'Go for a walk',
    'Listen to comfort music',
    'Talk to someone neutral',
    'Rest',
  ],
  transition: [
    'Breathe and name one emotion',
    'Take a short walk',
    'Read a letter you wrote',
    'Drink water',
    'Rest',
  ],
  other: [
    'Drink water',
    'Take a short walk',
    'Listen to something calming',
    'Write three lines without judging',
    'Rest',
  ],
};

function emotionHint(payload: EmergencyKitSessionPayload, locale: 'es' | 'en'): string {
  const emotions = payload.recentEmotions;
  if (emotions.length === 0) return '';
  const recent = emotions.slice(-3).join(', ');
  return locale === 'en'
    ? `Your recent check-ins mention ${recent}. `
    : `Tus check-ins recientes mencionan ${recent}. `;
}

export function buildFallbackEmergencyKitResponse(
  payload: EmergencyKitSessionPayload
): EmergencyKitAiResponse {
  const { eventId, locale, customText } = payload;
  const crisisMode = isCrisisEvent(eventId, customText);
  const label =
    locale === 'en' ? EVENT_LABELS_EN[eventId] : EVENT_LABELS_ES[eventId];
  const hint = emotionHint(payload, locale);

  let supportMessage: string;
  if (locale === 'en') {
    const detail = customText ? ` You wrote: "${customText.slice(0, 120)}".` : '';
    supportMessage = `${hint}You're going through ${label}.${detail} You don't have to solve everything today. It can simply be about getting through the next few hours — taking care of you, not performing.`;
    if (payload.avgEnergy !== null && payload.avgEnergy <= 2.5) {
      supportMessage += " Your energy has been low lately; that's okay.";
    }
  } else {
    const detail = customText ? ` Escribiste: «${customText.slice(0, 120)}».` : '';
    supportMessage = `${hint}Estás atravesando ${label}.${detail} No tienes que resolver todo hoy. Puede bastar con atravesar las próximas horas — cuidarte, no rendir.`;
    if (payload.avgEnergy !== null && payload.avgEnergy <= 2.5) {
      supportMessage += ' Tu energía ha estado baja; está bien.';
    }
  }

  let patternInsight: string | undefined;
  if (payload.energyTrend === 'low' && payload.checkInCount >= 3) {
    patternInsight =
      locale === 'en'
        ? 'Your energy has dipped recently. Gentle rest may help more than pushing today.'
        : 'Tu energía ha bajado últimamente. Un descanso suave puede ayudar más que forzar hoy.';
  } else if (payload.preferences.favoriteActivity) {
    patternInsight =
      locale === 'en'
        ? `${payload.preferences.favoriteActivity} has been a comfort for you before — it might help again.`
        : `${payload.preferences.favoriteActivity} te ha ayudado antes; podría servirte otra vez.`;
  }

  const actions = locale === 'en' ? ACTIONS_EN[eventId] : ACTIONS_ES[eventId];

  return {
    supportMessage,
    gentleActions: actions.slice(0, 5),
    patternInsight,
    crisisMode,
    prioritizedModules: getDefaultModulePriority(eventId),
    recommendedItemIds: [],
    fromAi: false,
  };
}
