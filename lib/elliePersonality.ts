/**
 * Ellie — personalidad oficial (compañera, no búho perseguidor).
 *
 * Vibe: Duolingo-owl *pero* calmada. Presencia cálida, mensajes cortos,
 * movimiento lento. Nunca juzga, nunca presión, nunca culpa.
 *
 * Guía de expresiones: Neutral, Happy, Sleepy, Focus, Comforting, Proud,
 * Cozy, Curious, Breathing, Grateful. Cada una tiene PNG en `assets/images/`.
 */

import type { TranslationKey } from '@/lib/i18n';

/** Expresiones de la guía de diseño. */
export type EllieExpression =
  | 'neutral'
  | 'happy'
  | 'sleepy'
  | 'focus'
  | 'comforting'
  | 'proud'
  | 'cozy'
  | 'curious'
  | 'breathing'
  | 'grateful';

/** Moods con PNG en `assets/images/ellie-*.png`. */
export type EllieMood =
  | 'default'
  | 'happy'
  | 'sleepy'
  | 'breathing'
  | 'grateful'
  | 'focus'
  | 'comforting'
  | 'proud'
  | 'cozy'
  | 'curious';

/** Momentos donde Ellie puede aparecer (una sola voz por pantalla). */
export type EllieMoment =
  | 'hoy_idle'
  | 'hoy_check_in'
  | 'step_done'
  | 'night'
  | 'care'
  | 'breath'
  | 'streak'
  | 'notif_daily'
  | 'notif_recheck'
  | 'notif_capture'
  | 'notif_care';

export type ElliePresence = {
  expression: EllieExpression;
  mood: EllieMood;
  messageKey: TranslationKey;
};

export type ElliePresenceContext = {
  emotionKey?: string;
  energyLevel?: number;
  /** Semilla para rotar avisos diarios sin repetir siempre el mismo retrato. */
  salt?: number;
  /** Sin pasos sugeridos: Ellie apunta a anotar uno, no a cerrar el día. */
  planEmpty?: boolean;
  /** Ya cerró lo de hoy: ahí sí “suficiente”. */
  allFocusDone?: boolean;
};

/** Una expresión = un retrato. Neutral usa el mascot por defecto. */
export const ELLIE_EXPRESSION_TO_MOOD: Record<EllieExpression, EllieMood> = {
  neutral: 'default',
  happy: 'happy',
  sleepy: 'sleepy',
  focus: 'focus',
  comforting: 'comforting',
  proud: 'proud',
  cozy: 'cozy',
  curious: 'curious',
  breathing: 'breathing',
  grateful: 'grateful',
};

const LINE: Record<EllieExpression, TranslationKey> = {
  neutral: 'ellie.lines.neutral',
  happy: 'ellie.lines.happy',
  sleepy: 'ellie.lines.sleepy',
  focus: 'ellie.lines.focus',
  comforting: 'ellie.lines.comforting',
  proud: 'ellie.lines.proud',
  cozy: 'ellie.lines.cozy',
  curious: 'ellie.lines.curious',
  breathing: 'ellie.lines.breathing',
  grateful: 'ellie.lines.grateful',
};

/** Post check-in: recibe cómo llegaste. “Suficiente” es cierre, no saludo. */
const CHECK_IN_LINE: Record<EllieExpression, TranslationKey> = {
  neutral: 'ellie.lines.checkInCalm',
  happy: 'ellie.lines.checkInUp',
  sleepy: 'ellie.lines.checkInLow',
  focus: 'ellie.lines.checkInFocus',
  comforting: 'ellie.lines.comforting',
  proud: 'ellie.lines.checkInUp',
  cozy: 'ellie.lines.checkInCalm',
  curious: 'ellie.lines.checkInFocus',
  breathing: 'ellie.lines.breathing',
  grateful: 'ellie.lines.checkInCalm',
};

const DAILY_NOTIF_CYCLE: EllieExpression[] = ['neutral', 'happy', 'grateful'];

function clampEnergy(level: number): 1 | 2 | 3 | 4 | 5 {
  const n = Math.round(level);
  if (n <= 1) return 1;
  if (n >= 5) return 5;
  return n as 2 | 3 | 4;
}

function presence(expression: EllieExpression, lineMap: Record<EllieExpression, TranslationKey> = LINE): ElliePresence {
  return {
    expression,
    mood: ELLIE_EXPRESSION_TO_MOOD[expression],
    messageKey: lineMap[expression],
  };
}

/** Labels EN/ES → clave canónica del check-in. */
const EMOTION_ALIASES: Record<string, string> = {
  agotada: 'agotada',
  cansada: 'agotada',
  tired: 'agotada',
  'low energy': 'agotada',
  tranquila: 'tranquila',
  calm: 'tranquila',
  'en calma': 'tranquila',
  ansiosa: 'ansiosa',
  anxious: 'ansiosa',
  motivada: 'motivada',
  'up for it': 'motivada',
  'con ganas': 'motivada',
  abrumada: 'abrumada',
  overwhelmed: 'abrumada',
  enfocada: 'enfocada',
  present: 'enfocada',
  presente: 'enfocada',
};

export function normalizeEllieEmotionKey(emotionKey: string): string {
  return EMOTION_ALIASES[emotionKey.trim().toLowerCase()] ?? emotionKey.trim().toLowerCase();
}

/** Check-in → una expresión distinta por emoción (el arte no se recicla). */
function expressionFromCheckIn(emotionKey: string, energyLevel: number): EllieExpression {
  const emotion = normalizeEllieEmotionKey(emotionKey);
  const energy = energyLevel > 0 ? clampEnergy(energyLevel) : 3;

  switch (emotion) {
    case 'abrumada':
      return 'comforting';
    case 'ansiosa':
      return 'breathing';
    case 'agotada':
      return 'sleepy';
    case 'motivada':
      return 'happy';
    case 'enfocada':
      return 'focus';
    case 'tranquila':
      return energy <= 2 ? 'sleepy' : 'cozy';
    default:
      if (energy <= 2) return 'sleepy';
      if (energy >= 4) return 'happy';
      return 'neutral';
  }
}

/**
 * Resuelve mood + frase oficial de Ellie para un momento de la app.
 * Una presencia: poco texto, sin presión, sin culpa.
 */
export function resolveElliePresence(
  moment: EllieMoment,
  ctx: ElliePresenceContext = {},
): ElliePresence {
  switch (moment) {
    case 'hoy_idle':
      return presence('neutral');
    case 'hoy_check_in': {
      const expression = expressionFromCheckIn(ctx.emotionKey ?? '', ctx.energyLevel ?? 0);
      if (ctx.allFocusDone) return presence('grateful');
      if (ctx.planEmpty) {
        return {
          expression,
          mood: ELLIE_EXPRESSION_TO_MOOD[expression],
          messageKey: 'ellie.lines.checkInEmpty',
        };
      }
      return presence(expression, CHECK_IN_LINE);
    }
    case 'step_done':
      return presence('happy');
    case 'night':
      return presence('cozy');
    case 'care':
      return presence('sleepy');
    case 'breath':
      return presence('breathing');
    case 'streak':
      return presence('proud');
    case 'notif_care':
      return presence('cozy');
    case 'notif_capture':
      return presence('curious');
    case 'notif_recheck':
      return presence('happy');
    case 'notif_daily': {
      if (ctx.emotionKey || (ctx.energyLevel != null && ctx.energyLevel > 0)) {
        const fromCheckIn = expressionFromCheckIn(
          ctx.emotionKey ?? '',
          ctx.energyLevel ?? 0,
        );
        if (fromCheckIn === 'comforting' || fromCheckIn === 'sleepy') {
          return presence(fromCheckIn);
        }
      }
      const cycle = DAILY_NOTIF_CYCLE[Math.abs(ctx.salt ?? 0) % DAILY_NOTIF_CYCLE.length]!;
      return presence(cycle);
    }
    default:
      return presence('neutral');
  }
}

/** Atajo Hoy post check-in (API estable para la UI). */
export function resolveEllieCompanionCue(
  emotionKey: string,
  energyLevel: number,
  extras: { planEmpty?: boolean; allFocusDone?: boolean } = {},
): ElliePresence {
  return resolveElliePresence('hoy_check_in', {
    emotionKey,
    energyLevel,
    ...extras,
  });
}
