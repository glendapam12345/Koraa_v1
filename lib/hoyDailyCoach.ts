import type { AppLocale } from '@/lib/i18n';

export type HoyCoachMessage = {
  greeting: string;
  body: string;
  actionLine: string;
};

export type HoyCoachInput = {
  locale: AppLocale;
  displayName: string;
  emotionKey: string;
  emotionLabel: string;
  energyLevel: number;
  suggestion: string;
  focusCount: number;
};

function weekdayLabel(locale: AppLocale, date: Date): string {
  return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { weekday: 'long' });
}

/**
 * Mensaje personalizado tipo coach (reglas locales; listo para Edge/IA después).
 */
export function buildHoyCoachMessage(input: HoyCoachInput): HoyCoachMessage {
  const {
    locale,
    displayName,
    emotionKey,
    emotionLabel,
    energyLevel,
    suggestion,
    focusCount,
  } = input;
  const day = weekdayLabel(locale, new Date());
  const e = emotionKey.toLowerCase();

  const greeting =
    locale === 'en'
      ? `${displayName}, today is ${day}`
      : `${displayName}, hoy es ${day}`;

  const feelPart =
    locale === 'en'
      ? `You're feeling ${emotionLabel.toLowerCase()} (energy ${energyLevel}/5).`
      : `Te sientes ${emotionLabel.toLowerCase()} · energía ${energyLevel}/5.`;

  let actionLine = suggestion.trim();
  if (!actionLine) {
    if (energyLevel <= 2 || ['agotada', 'ansiosa', 'abrumada'].includes(e)) {
      actionLine =
        locale === 'en'
          ? 'One gentle step and short breaks — no need to push.'
          : 'Un paso suave y pausas cortas; no hace falta forzar.';
    } else if (energyLevel >= 4) {
      actionLine =
        locale === 'en'
          ? `Good energy today — ${focusCount > 0 ? 'start with the first suggested step' : 'capture tasks, then check in on Today'}.`
          : `Buena energía hoy — ${focusCount > 0 ? 'empieza por el primer paso sugerido' : 'anota pendientes y haz check-in en Hoy'}.`;
    } else {
      actionLine =
        locale === 'en'
          ? 'Steady pace: 2–3 suggested steps may be enough for today.'
          : 'Ritmo constante: con 2–3 pasos sugeridos puede bastar hoy.';
    }
  } else {
    const prefix = locale === 'en' ? 'We suggest: ' : 'Te recomendamos: ';
    actionLine = prefix + actionLine;
  }

  return {
    greeting,
    body: feelPart,
    actionLine,
  };
}
