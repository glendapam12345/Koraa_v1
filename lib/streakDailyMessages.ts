/**
 * Mensajes de ánimo en la tarjeta de racha (Yo): rotan según el día local,
 * misma frase todo el día, otra al día siguiente.
 */

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i);
  }
  return Math.abs(h);
}

/** Racha 1–6 (nivel “Comenzando”) */
const POOL_LOW: readonly string[] = [
  '¡Cada día cuenta!',
  'Un día más. Venga.',
  'Sigue así.',
  'Aquí estás, eso importa.',
  'Paso a paso.',
  'Hoy también suma.',
  'Un día más en tu ritmo.',
  'Constancia bonita.',
  'Así se construye el hábito.',
  'Pequeño paso, gran efecto.',
];

/** Racha 7–13 (“En camino”) */
const POOL_7: readonly string[] = [
  '¡Buen comienzo! Sigue así',
  'Vas agarrando el ritmo.',
  'Una semana ya dice mucho.',
  'Sigue, que pinta bien.',
  'Eso es constancia.',
  'No sueltes el hilo.',
  'Cada día te acerca.',
  'Bien ahí, sigue.',
  'Tu futuro yo te lo agradece.',
  'Un día más, venga.',
];

/** Racha 14–29 (“Consistente”) */
const POOL_14: readonly string[] = [
  '¡Excelente consistencia!',
  'Ya se nota el hábito.',
  'Sigue así, vas fuerte.',
  'Eres constancia en persona.',
  'Dos semanas y contando.',
  'Impresionante ritmo.',
  'No es suerte, es tú.',
  'Cada día suma de verdad.',
  'Así se hace.',
  'Tu racha inspira.',
];

/** Racha 30–59 (“Avanzada”) */
const POOL_30: readonly string[] = [
  '¡Racha avanzada! Sigue así',
  'Nivel serio de constancia.',
  'Esto ya es compromiso.',
  'Sigue brillando.',
  'Un mes y no paras.',
  'Admirable constancia.',
  'Tu disciplina se nota.',
  'Sigue, que vas de lujo.',
  'Orgullo de racha.',
  'Así se cuida uno.',
];

/** Racha 60–89 (“Experta”) */
const POOL_60: readonly string[] = [
  '¡Nivel experto alcanzado!',
  'Eres referente de constancia.',
  'Casi nada te detiene.',
  'Racha de campeonato.',
  'Esto ya es maestría en proceso.',
  'Increíble lo que llevas.',
  'Sigue, experta.',
  'Tu constancia es oro.',
  'Nivel top.',
  'Así se llega lejos.',
];

/** Racha 90+ (“Maestra”) */
const POOL_90: readonly string[] = [
  '¡Eres una maestra de la consistencia!',
  'Nivel leyenda.',
  'Esto ya es arte.',
  'Constancia absoluta.',
  'Eres inspiración pura.',
  'No hay quien te baje.',
  'Maestría en cuidarte.',
  'Tu racha es historia.',
  'Brutal constancia.',
  'Así se vive con intención.',
];

export function pickDailyStreakEncouragement(streak: number, dateKey: string): string {
  const tierKey = (() => {
    if (streak >= 90) return '90';
    if (streak >= 60) return '60';
    if (streak >= 30) return '30';
    if (streak >= 14) return '14';
    if (streak >= 7) return '7';
    return 'low';
  })();

  const pool =
    tierKey === '90'
      ? POOL_90
      : tierKey === '60'
        ? POOL_60
        : tierKey === '30'
          ? POOL_30
          : tierKey === '14'
            ? POOL_14
            : tierKey === '7'
              ? POOL_7
              : POOL_LOW;

  const idx = hashString(`${dateKey}|${tierKey}|${streak}`) % pool.length;
  return pool[idx] ?? pool[0];
}

/** Fecha local YYYY-MM-DD (no UTC). */
export function getLocalDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
