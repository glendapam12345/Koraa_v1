import type { TipCategoryId } from '@/lib/tipsTypes';
import type { TipAction } from '@/lib/tipActions';

export type CatalogTipEntry = {
  id: string;
  category: TipCategoryId;
  title: string;
  body: string;
  emoji: string;
  /** Abre Spotify, sesión de foco en la app, etc. */
  action?: TipAction;
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
    title: 'Tu canción poderosa',
    body: 'Pon una canción que te levante el ánimo 3 minutos. No hace falta bailar: solo escuchar y respirar.',
    emoji: '🎧',
    action: 'spotify',
    emotions: ['agotada', 'ansiosa', 'abrumada'],
  },
  {
    id: 'mind-2',
    category: 'mindset',
    title: 'Historias mentales',
    body: '¿Qué historia te estás contando hoy? Escríbela en una frase y pregúntate si es 100% cierta.',
    emoji: '🧠',
    emotions: ['ansiosa', 'abrumada'],
  },
  {
    id: 'mind-3',
    category: 'mindset',
    title: 'Medita o respira',
    body: '4 respiraciones lentas: inhala 4, sostén 2, exhala 6. Tu cuerpo entiende antes que tu mente.',
    emoji: '🌬️',
    action: 'health_mindfulness',
    emotions: ['ansiosa', 'agotada', 'abrumada'],
  },
  {
    id: 'mind-4',
    category: 'mindset',
    title: 'Escribe y suelta',
    body: 'Dos minutos en notas: qué sientes, qué necesitas, qué puede esperar. Cierra la app y respira.',
    emoji: '📝',
    action: 'reminders',
    emotions: ['abrumada', 'ansiosa'],
  },
  {
    id: 'mind-5',
    category: 'mindset',
    title: 'Sé amable contigo',
    body: 'Hoy no tienes que rendir al 100%. Un paso pequeño cuenta como victoria.',
    emoji: '💗',
    emotions: ['agotada', 'abrumada'],
  },
  {
    id: 'mind-6',
    category: 'mindset',
    title: 'Sin redes al despertar',
    body: 'Los primeros 15 minutos del día sin scroll. Tu cerebro te lo agradecerá.',
    emoji: '📵',
    minEnergy: 1,
    maxEnergy: 3,
  },
  {
    id: 'mind-7',
    category: 'mindset',
    title: 'Aterriza el día',
    body: 'Nombra 3 cosas concretas que sí puedes hacer hoy. El resto va al calendario sin culpa.',
    emoji: '🪨',
    emotions: ['enfocada', 'motivada', 'tranquila'],
  },
  {
    id: 'mind-8',
    category: 'mindset',
    title: 'Celebra lo hecho',
    body: 'Antes de seguir, reconoce una cosa que ya lograste hoy, por pequeña que sea.',
    emoji: '✨',
    emotions: ['motivada', 'tranquila'],
  },
  // —— Descanso ——
  {
    id: 'rest-1',
    category: 'rest',
    title: 'Pausa de 5 minutos',
    body: 'Aleja la pantalla, estira cuello y hombros. Vuelve cuando tu pulso baje un poco.',
    emoji: '☕',
    emotions: ['agotada', 'ansiosa'],
    maxEnergy: 2,
  },
  {
    id: 'rest-2',
    category: 'rest',
    title: 'Sueño importa',
    body: 'Si anoche dormiste poco, baja la lista de hoy a 2 focos. Koraa ya priorizó por ti.',
    emoji: '🌙',
    emotions: ['agotada'],
    maxEnergy: 2,
  },
  {
    id: 'rest-3',
    category: 'rest',
    title: 'Descanso activo',
    body: 'Caminar 10 minutos cuenta como reset. No necesitas una hora libre.',
    emoji: '🚶‍♀️',
    minEnergy: 2,
    maxEnergy: 4,
  },
  {
    id: 'rest-4',
    category: 'rest',
    title: 'Baja el cortisol',
    body: 'Agua, luz suave, algo caliente. Tu sistema nervioso busca señales de seguridad.',
    emoji: '🫖',
    emotions: ['ansiosa', 'agotada'],
  },
  {
    id: 'rest-5',
    category: 'rest',
    title: 'No saltes comida',
    body: 'Algo simple y nutritivo estabiliza energía y ánimo. No tiene que ser perfecto.',
    emoji: '🥣',
    maxEnergy: 3,
  },
  {
    id: 'rest-6',
    category: 'rest',
    title: 'Micro siesta mental',
    body: 'Cierra ojos 2 minutos con música suave. No es flojera, es mantenimiento.',
    emoji: '😌',
    action: 'apple_music',
    emotions: ['agotada'],
  },
  // —— Acción suave ——
  {
    id: 'act-1',
    category: 'action',
    title: 'Una cosa a la vez',
    body: 'Elige la tarea más pequeña de tu lista y termínala antes de abrir otra.',
    emoji: '👣',
    emotions: ['ansiosa', 'abrumada'],
  },
  {
    id: 'act-2',
    category: 'action',
    title: 'Pide ayuda',
    body: 'Un mensaje corto: «¿Puedes ayudarme con X?» A veces aligera más que una hora de esfuerzo solo.',
    emoji: '🤝',
    emotions: ['abrumada', 'agotada'],
  },
  {
    id: 'act-3',
    category: 'action',
    title: 'Bloque de 25 min',
    body: 'Un pomodoro en una sola tarea. Descanso 5 min después, sin culpa.',
    emoji: '⏱️',
    action: 'focus_session',
    emotions: ['enfocada', 'motivada'],
    minEnergy: 3,
  },
  {
    id: 'act-4',
    category: 'action',
    title: 'Mueve el cuerpo',
    body: 'Estiramientos o baile 5 min. La energía sube sin café extra.',
    emoji: '💃',
    emotions: ['motivada', 'tranquila'],
    minEnergy: 2,
  },
  {
    id: 'act-5',
    category: 'action',
    title: 'Decisión pequeña',
    body: 'Si algo te bloquea, elige la opción «suficientemente buena» en 2 minutos y avanza.',
    emoji: '🔀',
    emotions: ['ansiosa'],
  },
  {
    id: 'act-6',
    category: 'action',
    title: 'Sal al aire',
    body: 'Luz natural 10 minutos. Ayuda a regular ritmo y claridad mental.',
    emoji: '🌤️',
    minEnergy: 2,
  },
  // —— Enfoque y trabajo ——
  {
    id: 'prod-1',
    category: 'productivity',
    title: 'Solo lo esencial',
    body: 'Mira tus 2–5 focos en Hoy. El resto puede esperar sin que signifique fracaso.',
    emoji: '🎯',
    emotions: ['abrumada', 'agotada'],
  },
  {
    id: 'prod-2',
    category: 'productivity',
    title: 'Tarea creativa primero',
    body: 'Con energía alta, haz lo que pide más cerebro antes del admin.',
    emoji: '💡',
    emotions: ['motivada', 'enfocada'],
    minEnergy: 4,
  },
  {
    id: 'prod-3',
    category: 'productivity',
    title: 'Divide y vence',
    body: 'Parte una tarea grande en 3 pasos de 15 min. Marca el primero como foco.',
    emoji: '🧩',
    emotions: ['abrumada', 'ansiosa'],
  },
  {
    id: 'prod-4',
    category: 'productivity',
    title: 'Modo enfoque',
    body: 'Silencia notificaciones 30 min. Una ventana, una lista, un objetivo.',
    emoji: '🔕',
    emotions: ['enfocada'],
    minEnergy: 3,
  },
  {
    id: 'prod-5',
    category: 'productivity',
    title: 'Admin al final',
    body: 'Correos y mensajes después de tu foco principal. Protege tu mejor energía.',
    emoji: '📬',
    minEnergy: 3,
  },
  {
    id: 'prod-6',
    category: 'productivity',
    title: 'Ritmo sostenible',
    body: 'Energía alta no significa hacerlo todo. Programa pausas en el calendario.',
    emoji: '📅',
    emotions: ['motivada'],
    minEnergy: 4,
  },
  {
    id: 'prod-7',
    category: 'productivity',
    title: 'Empieza fácil',
    body: 'La tarea más simple genera impulso. Koraa ya la tiene en tu lista.',
    emoji: '🚀',
    emotions: ['agotada', 'ansiosa'],
    maxEnergy: 3,
  },
  {
    id: 'prod-8',
    category: 'productivity',
    title: 'Calma productiva',
    body: 'Con tranquilidad, prioriza decisiones importantes antes del ruido del día.',
    emoji: '🌊',
    emotions: ['tranquila'],
  },
];
