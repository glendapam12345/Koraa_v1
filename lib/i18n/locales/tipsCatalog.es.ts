import type { TipCategoryId } from '@/lib/tipsTypes';
import type { TipAction } from '@/lib/tipActions';

/** Apps externas opcionales — nunca el camino principal del consejo. */
export type TipOptionalApp = Extract<TipAction, 'spotify' | 'apple_music'>;

/** CTAs que se quedan dentro de Koraa. */
export type TipInAppAction = Extract<TipAction, 'hoy' | 'vaciar' | 'focus_session' | 'breath'>;

export type CatalogTipEntry = {
  id: string;
  category: TipCategoryId;
  title: string;
  /** Por qué / contexto — se lee aquí, sin salir. */
  body: string;
  emoji: string;
  /** Cómo — pasos concretos dentro de Koraa. */
  howSteps: string[];
  /** CTA interno opcional (Hoy, Tareas, sesión corta). */
  action?: TipInAppAction;
  /** Abrir otra app solo si suma — secundario. */
  optionalApp?: TipOptionalApp;
  /** Emociones donde este tip encaja mejor */
  emotions?: string[];
  /** Energía 1–5 */
  minEnergy?: number;
  maxEnergy?: number;
};

export const TIPS_CATALOG_ES: CatalogTipEntry[] = [
  // —— Bienestar mental (mindset) ——
  {
    id: 'mind-1',
    category: 'mindset',
    title: 'Una canción que te acompañe',
    body: 'A veces un sonido suave basta para bajar un poco el volumen interno. No es productividad: es compañía.',
    emoji: '🎧',
    howSteps: [
      'Elige una canción o playlist que te sostenga (no una que te active).',
      'Pon auriculares o el parlante bajo 3 minutos.',
      'Solo escucha y respira — no hace falta bailar ni “aprovechar”.',
    ],
    optionalApp: 'spotify',
    emotions: ['agotada', 'ansiosa', 'abrumada'],
  },
  {
    id: 'mind-2',
    category: 'mindset',
    title: 'Historias mentales',
    body: 'La mente inventa relatos cuando hay ansiedad. Nombrarlos los hace un poco más suaves.',
    emoji: '🧠',
    howSteps: [
      'En una frase, escribe: “Me estoy contando que…”',
      'Pregúntate: ¿es del todo cierta, o solo una parte?',
      'Si quieres, añade: “También podría ser que…”',
    ],
    emotions: ['ansiosa', 'abrumada'],
  },
  {
    id: 'mind-3',
    category: 'mindset',
    title: 'Medita o respira',
    body: 'Tu cuerpo entiende el ritmo antes que tu mente. Tres respiraciones ya cuentan.',
    emoji: '🌬️',
    howSteps: [
      'Siéntate o quédate quieta donde estés.',
      'Inhala, aguanta, suelta — tres veces.',
      'Nota un lugar del cuerpo un poco más suave al terminar.',
    ],
    action: 'breath',
    emotions: ['ansiosa', 'agotada', 'abrumada'],
  },
  {
    id: 'mind-4',
    category: 'mindset',
    title: 'Escribe y suelta',
    body: 'Sacar lo que pesa de la cabeza a unas líneas libera espacio. No es un diario perfecto.',
    emoji: '📝',
    howSteps: [
      'Dos minutos: qué sientes, qué necesitas, qué puede esperar.',
      'Cierra la nota (o el papel) sin releer todo.',
      'Respira una vez y vuelve a lo tuyo.',
    ],
    emotions: ['abrumada', 'ansiosa'],
  },
  {
    id: 'mind-5',
    category: 'mindset',
    title: 'Sé amable contigo',
    body: 'Hoy no hace falta darte todo. Un paso pequeño ya es cuidado.',
    emoji: '💗',
    howSteps: [
      'Di en voz baja: “Hoy basta con menos.”',
      'Elige un solo gesto mínimo (agua, estirar, un mensaje).',
      'Si lo haces, cuenta — si no, también está bien.',
    ],
    emotions: ['agotada', 'abrumada'],
  },
  {
    id: 'mind-6',
    category: 'mindset',
    title: 'Sin redes al despertar',
    body: 'Los primeros minutos del día marcan el tono. Sin scroll, sin culpa si un día no sale.',
    emoji: '📵',
    howSteps: [
      'Al despertar, deja el teléfono boca abajo unos minutos.',
      'Haz algo sensorial: agua, luz, estirar.',
      'Si ya abriste redes, cierra y retoma — sin drama.',
    ],
    minEnergy: 1,
    maxEnergy: 3,
  },
  {
    id: 'mind-7',
    category: 'mindset',
    title: 'Aterriza el día',
    body: 'Nombrar 1–3 cosas pequeñas da suelo. El resto puede esperar sin culpa.',
    emoji: '🪨',
    howSteps: [
      'Mira Hoy o anota mentalmente 1–3 cosas chicas.',
      'Marca cuál es la más liviana para empezar.',
      'Deja el resto fuera de la mesa por ahora.',
    ],
    action: 'hoy',
    emotions: ['enfocada', 'motivada', 'tranquila'],
  },
  {
    id: 'mind-8',
    category: 'mindset',
    title: 'Celebra lo hecho',
    body: 'Antes de seguir, reconocer lo ya hecho cambia el cuerpo. Aunque sea mínimo.',
    emoji: '✨',
    howSteps: [
      'Nombra una cosa que ya hiciste hoy (aunque sea levantarte).',
      'Siéntela 5 segundos — sin minimizar.',
      'Luego decide si quieres un paso más o parar.',
    ],
    emotions: ['motivada', 'tranquila'],
  },
  // —— Descanso ——
  {
    id: 'rest-1',
    category: 'rest',
    title: 'Pausa de 5 minutos',
    body: 'Alejar la pantalla un momento no es flojera: es mantenimiento.',
    emoji: '☕',
    howSteps: [
      'Deja el teléfono fuera de la mano.',
      'Estira cuello y hombros, o camina a otra habitación.',
      'Vuelve cuando quieras — sin cronómetro estricto.',
    ],
    emotions: ['agotada', 'ansiosa'],
    maxEnergy: 2,
  },
  {
    id: 'rest-2',
    category: 'rest',
    title: 'Sueño importa',
    body: 'Si anoche dormiste poco, hoy pueden bastar 2 pasos pequeños. No es fracaso.',
    emoji: '🌙',
    howSteps: [
      'Revisa los pasos sugeridos en Hoy: quédate con 1–2.',
      'Baja la exigencia: “suficiente para hoy”.',
      'Si puedes, anota una hora de apagar pantallas esta noche.',
    ],
    action: 'hoy',
    emotions: ['agotada'],
    maxEnergy: 2,
  },
  {
    id: 'rest-3',
    category: 'rest',
    title: 'Descanso activo',
    body: 'Caminar unos minutos cuenta como reset. No necesitas una hora libre.',
    emoji: '🚶‍♀️',
    howSteps: [
      'Sal unos minutos — patio, pasillo o alrededor de la cuadra.',
      'Sin podcast obligatorio: solo moverte y mirar alrededor.',
      'Cuando vuelvas, nota si el cuerpo está un poco más suelto.',
    ],
    minEnergy: 2,
    maxEnergy: 4,
  },
  {
    id: 'rest-4',
    category: 'rest',
    title: 'Señales de calma',
    body: 'Pequeñas señales le dicen al cuerpo que está a salvo: agua, luz suave, algo caliente.',
    emoji: '🫖',
    howSteps: [
      'Elige una: vaso de agua, luz más baja, o algo tibio.',
      'Hazlo sin multitasking 2 minutos.',
      'Si puedes, nombra en silencio: “Estoy aquí.”',
    ],
    emotions: ['ansiosa', 'agotada'],
  },
  {
    id: 'rest-5',
    category: 'rest',
    title: 'No saltes comida',
    body: 'Algo simple y nutritivo puede ayudarte. No tiene que ser perfecto ni “clean”.',
    emoji: '🥣',
    howSteps: [
      'Come lo que tengas a mano: fruta, yogurt, pan, lo que sea.',
      'Siéntate un momento — no hace falta plato gourmet.',
      'Bebe un poco de agua después.',
    ],
    maxEnergy: 3,
  },
  {
    id: 'rest-6',
    category: 'rest',
    title: 'Micro pausa mental',
    body: 'Cerrar los ojos un par de minutos con sonido suave es mantenimiento, no flojera.',
    emoji: '😌',
    howSteps: [
      'Siéntate o recuéstate un momento.',
      'Opcional: pon música muy suave.',
      'Cierra ojos 2 minutos y vuelve sin juzgar.',
    ],
    optionalApp: 'apple_music',
    emotions: ['agotada'],
  },
  {
    id: 'rest-7',
    category: 'rest',
    title: 'Soltar antes de dormir',
    body: 'Lo que pesa puede esperar a mañana. Hoy basta con soltarlo un rato.',
    emoji: '🌙',
    howSteps: [
      'Anota en una línea lo que no quieres resolver ahora.',
      'Di: “Esto puede esperar hasta mañana.”',
      'Apaga pantallas un poco antes, si te nace.',
    ],
    emotions: ['agotada', 'ansiosa', 'abrumada'],
  },
  // —— Acción suave ——
  {
    id: 'act-1',
    category: 'action',
    title: 'Una cosa a la vez',
    body: 'Empezar por lo más pequeño baja la fricción. No hace falta terminarlo hoy.',
    emoji: '👣',
    howSteps: [
      'Mira Hoy y elige el paso más chiquito.',
      'Haz solo el primer gesto (abrir, enviar, anotar).',
      'Para ahí si quieres — ya contó.',
    ],
    action: 'hoy',
    emotions: ['ansiosa', 'abrumada'],
  },
  {
    id: 'act-2',
    category: 'action',
    title: 'Pide ayuda',
    body: 'Un mensaje corto a veces aligera más que hacerlo sola. Pedir no es fallar.',
    emoji: '🤝',
    howSteps: [
      'Elige a alguien de confianza.',
      'Escribe algo simple: “¿Puedes ayudarme con X?”',
      'Envíalo cuando puedas — o déjalo borrador si aún no.',
    ],
    emotions: ['abrumada', 'agotada'],
  },
  {
    id: 'act-3',
    category: 'action',
    title: 'Cinco minutos contigo',
    body: 'Dale cinco minutos a una sola cosa. Al terminar, puedes parar.',
    emoji: '⏱️',
    howSteps: [
      'Elige una sola cosa.',
      'Pon un temporizador suave de 5 minutos (en Koraa o donde quieras).',
      'Al sonar, decide: seguir o soltar.',
    ],
    action: 'focus_session',
    emotions: ['enfocada', 'motivada'],
    minEnergy: 3,
  },
  {
    id: 'act-4',
    category: 'action',
    title: 'Mueve el cuerpo',
    body: 'Estirar o bailar un rato a veces deja el cuerpo un poco más ligero.',
    emoji: '💃',
    howSteps: [
      'Ponte de pie o siéntate y estira.',
      'Opcional: una canción corta para moverte.',
      'Para cuando el cuerpo diga basta.',
    ],
    optionalApp: 'apple_music',
    emotions: ['motivada', 'tranquila'],
    minEnergy: 2,
  },
  {
    id: 'act-5',
    category: 'action',
    title: 'Decisión pequeña',
    body: 'Si algo te bloquea, “suficientemente buena” en 2 minutos suele bastar para avanzar.',
    emoji: '🔀',
    howSteps: [
      'Nombra las 2 opciones que te traban.',
      'Elige la “suficientemente buena” en 2 minutos.',
      'Da un solo paso en esa dirección.',
    ],
    emotions: ['ansiosa'],
  },
  {
    id: 'act-6',
    category: 'action',
    title: 'Sal al aire',
    body: 'Unos minutos de luz natural a veces ayudan a sentirse un poco más clara.',
    emoji: '🌤️',
    howSteps: [
      'Sal a un balcón, ventana o calle unos minutos.',
      'Mira algo lejos (cielo, árbol, horizonte).',
      'Vuelve cuando quieras.',
    ],
    minEnergy: 2,
  },
  {
    id: 'act-7',
    category: 'action',
    title: 'Aparta para mañana',
    body: 'Si algo pesa hoy, anotarlo y soltarlo es un acto de cuidado — no de abandono.',
    emoji: '📋',
    howSteps: [
      'Anota en Tareas o en una nota: “Para mañana: …”',
      'Di: “Hoy no tengo que resolver esto.”',
      'Vuelve a Hoy solo con lo liviano.',
    ],
    action: 'vaciar',
    emotions: ['abrumada', 'ansiosa', 'agotada'],
  },
  // —— Qué importa hoy ——
  {
    id: 'prod-1',
    category: 'productivity',
    title: 'Solo lo esencial',
    body: 'Los 2–5 pasos sugeridos en Hoy son el techo suave. El resto puede esperar — no es fracaso.',
    emoji: '🎯',
    howSteps: [
      'Abre Hoy y mira solo la lista de arriba.',
      'Elige uno, no todos.',
      'Ignora el resto sin culpa.',
    ],
    action: 'hoy',
    emotions: ['abrumada', 'agotada'],
  },
  {
    id: 'prod-2',
    category: 'productivity',
    title: 'Una cosa que importe',
    body: 'Con más energía, canalízala en una cosa que te importe — no en hacerlo todo.',
    emoji: '💡',
    howSteps: [
      'Nombra una cosa que te importe hoy.',
      'Ponla arriba en Hoy o empiézala 10 minutos.',
      'Cuando pares, ya contó.',
    ],
    action: 'hoy',
    emotions: ['motivada', 'enfocada'],
    minEnergy: 4,
  },
  {
    id: 'prod-3',
    category: 'productivity',
    title: 'Partir en pedazos',
    body: 'Algo grande se vuelve manejable en trozos chicos. El primero basta para empezar.',
    emoji: '🧩',
    howSteps: [
      'Escribe la cosa grande en una línea.',
      'Saca el pedazo más chico de ~15 min.',
      'Haz solo ese pedazo — o anótalo en Hoy.',
    ],
    action: 'hoy',
    emotions: ['abrumada', 'ansiosa'],
  },
  {
    id: 'prod-4',
    category: 'productivity',
    title: 'Menos ruido',
    body: 'Menos notificaciones = más espacio. Una ventana, una lista, un paso.',
    emoji: '🔕',
    howSteps: [
      'Silencia notificaciones un rato (No molestar o modo foco).',
      'Deja una sola app o pantalla abierta.',
      'Haz un solo paso de Hoy.',
    ],
    action: 'focus_session',
    emotions: ['enfocada'],
    minEnergy: 3,
  },
  {
    id: 'prod-5',
    category: 'productivity',
    title: 'Mensajes después',
    body: 'Correos y chats pueden esperar. Guardar energía para lo que te importe hoy también es avance.',
    emoji: '📬',
    howSteps: [
      'Cierra la bandeja o silencia chats 30–60 min.',
      'Elige un paso de Hoy primero.',
      'Vuelve a mensajes solo cuando quieras.',
    ],
    action: 'hoy',
    minEnergy: 3,
  },
  {
    id: 'prod-6',
    category: 'productivity',
    title: 'Ritmo sostenible',
    body: 'Energía alta no significa hacerlo todo. Las pausas también cuentan.',
    emoji: '📅',
    howSteps: [
      'Elige un bloque corto de foco.',
      'Planifica una pausa de 5 min después.',
      'Respeta la pausa aunque “aún puedas más”.',
    ],
    emotions: ['motivada'],
    minEnergy: 4,
  },
  {
    id: 'prod-7',
    category: 'productivity',
    title: 'Empieza fácil',
    body: 'Lo más simple ayuda a arrancar. Koraa ya lo tiene en tu lista.',
    emoji: '🚀',
    howSteps: [
      'Abre Hoy y toca el paso más fácil.',
      'Haz solo el primer gesto.',
      'Si paras ahí, el día ya tiene un punto a favor.',
    ],
    action: 'hoy',
    emotions: ['agotada', 'ansiosa'],
    maxEnergy: 3,
  },
  {
    id: 'prod-8',
    category: 'productivity',
    title: 'Con calma',
    body: 'Con tranquilidad, una decisión pequeña puede ser suficiente por hoy.',
    emoji: '🌊',
    howSteps: [
      'Respira una vez despacio.',
      'Elige una micro-decisión (sí/no, ahora/después).',
      'Actúala o anótala — y suelta el resto.',
    ],
    emotions: ['tranquila'],
  },
];
