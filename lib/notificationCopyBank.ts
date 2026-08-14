import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppLocale } from '@/lib/i18n';

export type NotifKind = 'daily' | 'recheck' | 'capture' | 'care';

/** Señal suave para elegir el pool (no LLM; patrones locales). */
export type NotifPatternTag =
  | 'default'
  | 'low_energy'
  | 'overwhelmed'
  | 'missed'
  | 'gentle_return'
  | 'named';

export type NotificationCopy = {
  id: string;
  title: string;
  body: string;
};

export type NotificationContext = {
  firstName?: string;
  /** Energía media reciente 1–5 */
  avgEnergy?: number;
  /** Emoción reciente (agotada, abrumada, …) */
  lastEmotion?: string;
  /** Días desde el último check-in (si se conoce) */
  daysSinceCheckIn?: number;
  /** Semilla para rotar (día del año, offset de bridge, etc.) */
  salt?: number;
};

const LAST_ID_PREFIX = 'koraa_notif_last_copy_v1_';

type Bank = Record<NotifKind, Record<NotifPatternTag, NotificationCopy[]>>;

const BANK_ES: Bank = {
  daily: {
    default: [
      {
        id: 'd_es_1',
        title: 'Ellie por aquí 💗',
        body: 'Un minuto en Hoy y te dejo un paso suave. Sin prisa.',
      },
      {
        id: 'd_es_2',
        title: '¿Cómo amaneciste?',
        body: 'Ellie quiere saber. Toca, siente, y armamos tu Hoy juntos.',
      },
      {
        id: 'd_es_3',
        title: 'Hola de nuevo',
        body: 'No hace falta hacer todo. Un check-in y un paso bastan.',
      },
      {
        id: 'd_es_4',
        title: 'Tu Hoy te espera',
        body: 'Ellie ya está lista. Di cómo te sientes y te sugiero algo chiquito.',
      },
      {
        id: 'd_es_5',
        title: 'Sin culpa, ¿sí?',
        body: 'Vuelve un momentito. Koraa + Ellie ajustan lo que cabe hoy.',
      },
    ],
    low_energy: [
      {
        id: 'd_es_le1',
        title: 'Día bajito — está bien',
        body: 'Ellie deja solo 1–2 pasos suaves. Ven a Hoy cuando puedas.',
      },
      {
        id: 'd_es_le2',
        title: 'Poca energía = menos lista',
        body: 'Un check-in corto y te achico el día. Sin presión.',
      },
    ],
    overwhelmed: [
      {
        id: 'd_es_ow1',
        title: 'Respira. Estoy aquí.',
        body: 'Si te sientes abrumada, Ellie deja un solo paso. Abre Hoy.',
      },
      {
        id: 'd_es_ow2',
        title: 'No tienes que con todo',
        body: 'Check-in suave → un paso. El resto puede esperar.',
      },
    ],
    missed: [
      {
        id: 'd_es_m1',
        title: 'Te extrañé un poquito',
        body: 'Sin dramas. Vuelve a Hoy cuando quieras — Ellie te espera.',
      },
      {
        id: 'd_es_m2',
        title: 'Sin racha rota, ¿ok?',
        body: 'Solo importa cuando vuelves. Un minuto basta.',
      },
    ],
    gentle_return: [
      {
        id: 'd_es_g1',
        title: 'Bienvenida otra vez',
        body: 'Ellie no guarda rencor. Un check-in y seguimos suave.',
      },
    ],
    named: [
      {
        id: 'd_es_n1',
        title: 'Hola, {{name}}',
        body: 'Ellie por aquí. ¿Cómo te sientes hoy? Un toque en Hoy.',
      },
      {
        id: 'd_es_n2',
        title: '{{name}}, un pasito',
        body: 'Di cómo estás y te dejo algo que sí cabe hoy.',
      },
    ],
  },
  recheck: {
    default: [
      {
        id: 'r_es_1',
        title: '¿Cambió tu día?',
        body: 'Ellie puede reajustar tus pasos. Actualiza en 20 segundos.',
      },
      {
        id: 'r_es_2',
        title: 'Check rápido',
        body: 'Si la energía bajó o subió, dime — adapto Hoy contigo.',
      },
    ],
    low_energy: [
      {
        id: 'r_es_le1',
        title: '¿Más cansada ahora?',
        body: 'Podemos dejar menos pasos. Ellie lo achica si me lo dices.',
      },
    ],
    overwhelmed: [
      {
        id: 'r_es_ow1',
        title: 'Si se puso pesado…',
        body: 'Actualiza cómo te sientes. Ellie deja solo lo esencial.',
      },
    ],
    missed: [],
    gentle_return: [],
    named: [
      {
        id: 'r_es_n1',
        title: '{{name}}, ¿sigue igual?',
        body: 'Un re-check y Ellie ajusta tu plan. Sin presión.',
      },
    ],
  },
  capture: {
    default: [
      {
        id: 'c_es_1',
        title: '¿Algo en la cabeza?',
        body: 'Suéltalo en Tareas. Ellie lo ordena después — una línea basta.',
      },
      {
        id: 'c_es_2',
        title: 'Vacía un poquito',
        body: 'Si hay ruido mental, anótalo. Luego te dejo un paso en Hoy.',
      },
      {
        id: 'c_es_3',
        title: 'Ellie pregunta…',
        body: '¿Qué llevas pendiente? Escríbelo sin ordenar. Yo ayudo.',
      },
    ],
    low_energy: [
      {
        id: 'c_es_le1',
        title: 'Solo una cosita',
        body: 'Con poca energía: anota 1 línea. Nada más.',
      },
    ],
    overwhelmed: [
      {
        id: 'c_es_ow1',
        title: 'Suelta el nudo',
        body: 'Escribe lo que te pesa. No hace falta resolverlo ahora.',
      },
    ],
    missed: [],
    gentle_return: [],
    named: [
      {
        id: 'c_es_n1',
        title: '{{name}}, ¿lo anotas?',
        body: 'Una línea en Tareas y Ellie se encarga del resto mañana.',
      },
    ],
  },
  care: {
    default: [
      {
        id: 'care_es_1',
        title: 'Hoy se achica',
        body: 'Ellie está en modo suave. Un paso basta. Estoy contigo.',
      },
      {
        id: 'care_es_2',
        title: 'Sin prisa hoy',
        body: 'Modo cuidado activo. Abre Hoy cuando quieras — un toque.',
      },
    ],
    low_energy: [
      {
        id: 'care_es_le1',
        title: 'Descansa está permitido',
        body: 'Ellie no te pide más. Solo un check-in suave si te apetece.',
      },
    ],
    overwhelmed: [
      {
        id: 'care_es_ow1',
        title: 'Estoy aquí',
        body: 'Respira. Un solo paso cuando puedas. Nada de listas largas.',
      },
    ],
    missed: [],
    gentle_return: [],
    named: [
      {
        id: 'care_es_n1',
        title: '{{name}}, modo suave',
        body: 'Hoy se achica contigo. Ellie te acompaña sin presión.',
      },
    ],
  },
};

const BANK_EN: Bank = {
  daily: {
    default: [
      {
        id: 'd_en_1',
        title: 'Ellie here 💗',
        body: 'One minute on Today and I leave you a gentle step. No rush.',
      },
      {
        id: 'd_en_2',
        title: 'How are you waking up?',
        body: 'Ellie wants to know. Tap, feel, and we shape Today together.',
      },
      {
        id: 'd_en_3',
        title: 'Hello again',
        body: 'You do not have to do it all. A check-in and one step are enough.',
      },
      {
        id: 'd_en_4',
        title: 'Your Today is waiting',
        body: 'Ellie is ready. Say how you feel and I will suggest something small.',
      },
      {
        id: 'd_en_5',
        title: 'No guilt, okay?',
        body: 'Come back for a moment. Koraa + Ellie fit what fits today.',
      },
    ],
    low_energy: [
      {
        id: 'd_en_le1',
        title: 'Low day — that is fine',
        body: 'Ellie keeps only 1–2 soft steps. Open Today when you can.',
      },
      {
        id: 'd_en_le2',
        title: 'Low energy = shorter list',
        body: 'A quick check-in and I shrink the day. No pressure.',
      },
    ],
    overwhelmed: [
      {
        id: 'd_en_ow1',
        title: 'Breathe. I am here.',
        body: 'If it feels heavy, Ellie leaves one step. Open Today.',
      },
      {
        id: 'd_en_ow2',
        title: 'You do not have to carry it all',
        body: 'Gentle check-in → one step. The rest can wait.',
      },
    ],
    missed: [
      {
        id: 'd_en_m1',
        title: 'Missed you a little',
        body: 'No drama. Come back to Today whenever — Ellie is waiting.',
      },
      {
        id: 'd_en_m2',
        title: 'No broken streak, okay?',
        body: 'What matters is when you return. One minute is enough.',
      },
    ],
    gentle_return: [
      {
        id: 'd_en_g1',
        title: 'Welcome back',
        body: 'Ellie does not hold grudges. One check-in and we go gently.',
      },
    ],
    named: [
      {
        id: 'd_en_n1',
        title: 'Hi, {{name}}',
        body: 'Ellie here. How do you feel today? One tap on Today.',
      },
      {
        id: 'd_en_n2',
        title: '{{name}}, one small step',
        body: 'Say how you are and I will leave something that fits today.',
      },
    ],
  },
  recheck: {
    default: [
      {
        id: 'r_en_1',
        title: 'Did your day shift?',
        body: 'Ellie can reshape your steps. Update in about 20 seconds.',
      },
      {
        id: 'r_en_2',
        title: 'Quick check',
        body: 'If energy went up or down, tell me — I adapt Today with you.',
      },
    ],
    low_energy: [
      {
        id: 'r_en_le1',
        title: 'More tired now?',
        body: 'We can leave fewer steps. Ellie shrinks them if you say so.',
      },
    ],
    overwhelmed: [
      {
        id: 'r_en_ow1',
        title: 'If it got heavy…',
        body: 'Update how you feel. Ellie keeps only the essentials.',
      },
    ],
    missed: [],
    gentle_return: [],
    named: [
      {
        id: 'r_en_n1',
        title: '{{name}}, still the same?',
        body: 'A re-check and Ellie adjusts your plan. No pressure.',
      },
    ],
  },
  capture: {
    default: [
      {
        id: 'c_en_1',
        title: 'Anything on your mind?',
        body: 'Drop it in Tasks. Ellie sorts later — one line is enough.',
      },
      {
        id: 'c_en_2',
        title: 'Empty a little',
        body: 'If your head is noisy, write it down. Then a step on Today.',
      },
      {
        id: 'c_en_3',
        title: 'Ellie asks…',
        body: 'What is pending? Write without sorting. I will help.',
      },
    ],
    low_energy: [
      {
        id: 'c_en_le1',
        title: 'Just one thing',
        body: 'Low energy: one line is enough. Nothing more.',
      },
    ],
    overwhelmed: [
      {
        id: 'c_en_ow1',
        title: 'Untie the knot',
        body: 'Write what weighs on you. You do not have to solve it now.',
      },
    ],
    missed: [],
    gentle_return: [],
    named: [
      {
        id: 'c_en_n1',
        title: '{{name}}, jot it down?',
        body: 'One line in Tasks and Ellie handles the rest tomorrow.',
      },
    ],
  },
  care: {
    default: [
      {
        id: 'care_en_1',
        title: 'Today shrinks',
        body: 'Ellie is in soft mode. One step is enough. I am with you.',
      },
      {
        id: 'care_en_2',
        title: 'No rush today',
        body: 'Care mode on. Open Today when you want — one tap.',
      },
    ],
    low_energy: [
      {
        id: 'care_en_le1',
        title: 'Rest is allowed',
        body: 'Ellie asks for nothing more. A soft check-in only if you want.',
      },
    ],
    overwhelmed: [
      {
        id: 'care_en_ow1',
        title: 'I am here',
        body: 'Breathe. One step when you can. No long lists.',
      },
    ],
    missed: [],
    gentle_return: [],
    named: [
      {
        id: 'care_en_n1',
        title: '{{name}}, soft mode',
        body: 'Today shrinks with you. Ellie walks with you — no pressure.',
      },
    ],
  },
};

function bankFor(locale: AppLocale): Bank {
  return locale === 'en' ? BANK_EN : BANK_ES;
}

const OVERWHELMED = new Set(['abrumada', 'ansiosa', 'agotada']);

/** Elige tags en orden de prioridad según contexto. */
export function resolveNotifPatternTags(ctx: NotificationContext): NotifPatternTag[] {
  const tags: NotifPatternTag[] = [];
  if (ctx.firstName && ctx.firstName.trim().length >= 2) tags.push('named');
  if ((ctx.daysSinceCheckIn ?? 0) >= 2) tags.push('missed', 'gentle_return');
  if (ctx.lastEmotion && OVERWHELMED.has(ctx.lastEmotion.toLowerCase())) {
    tags.push('overwhelmed');
  }
  if (typeof ctx.avgEnergy === 'number' && ctx.avgEnergy > 0 && ctx.avgEnergy <= 2.5) {
    tags.push('low_energy');
  }
  tags.push('default');
  return tags;
}

function applyName(copy: NotificationCopy, firstName?: string): NotificationCopy {
  const name = firstName?.trim() || '';
  if (!name) {
    return {
      ...copy,
      title: copy.title.replace(/,\s*\{\{name\}\}/g, '').replace(/\{\{name\}\}/g, 'tú'),
      body: copy.body.replace(/\{\{name\}\}/g, 'tú'),
    };
  }
  return {
    ...copy,
    title: copy.title.replace(/\{\{name\}\}/g, name),
    body: copy.body.replace(/\{\{name\}\}/g, name),
  };
}

function poolFor(
  locale: AppLocale,
  kind: NotifKind,
  tags: NotifPatternTag[],
): NotificationCopy[] {
  const bank = bankFor(locale)[kind];
  const seen = new Set<string>();
  const out: NotificationCopy[] = [];
  for (const tag of tags) {
    for (const item of bank[tag] ?? []) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }
  if (out.length === 0) return bank.default;
  return out;
}

function daySalt(extra = 0): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return day + extra * 17;
}

/**
 * Elige copy variado del banco (estilo Duolingo): rota y evita repetir el último id.
 */
export async function pickNotificationCopy(
  locale: AppLocale,
  kind: NotifKind,
  ctx: NotificationContext = {},
): Promise<NotificationCopy> {
  const tags = resolveNotifPatternTags(ctx);
  const pool = poolFor(locale, kind, tags);
  const storageKey = `${LAST_ID_PREFIX}${kind}_${locale}`;

  let lastId: string | null = null;
  try {
    lastId = await AsyncStorage.getItem(storageKey);
  } catch {
    /* ignore */
  }

  const salt = ctx.salt ?? daySalt();
  let index = Math.abs(salt) % pool.length;
  if (pool.length > 1 && pool[index]?.id === lastId) {
    index = (index + 1) % pool.length;
  }

  const chosen = applyName(pool[index]!, ctx.firstName);

  try {
    await AsyncStorage.setItem(storageKey, chosen.id);
  } catch {
    /* ignore */
  }

  return chosen;
}

/** Sync helper for tests / bridge offsets without touching storage. */
export function pickNotificationCopySync(
  locale: AppLocale,
  kind: NotifKind,
  ctx: NotificationContext = {},
  lastId?: string | null,
): NotificationCopy {
  const tags = resolveNotifPatternTags(ctx);
  const pool = poolFor(locale, kind, tags);
  const salt = ctx.salt ?? daySalt();
  let index = Math.abs(salt) % pool.length;
  if (pool.length > 1 && pool[index]?.id === lastId) {
    index = (index + 1) % pool.length;
  }
  return applyName(pool[index]!, ctx.firstName);
}
