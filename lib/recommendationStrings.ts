import type { AppLocale } from '@/lib/i18n';

export const CONCRETE_PODCASTS_ES = [
  {
    title: 'Escuchar: El podcast de Tim Ferriss',
    message: 'Conversaciones sobre hábitos, calma y curiosidad. Puedes escuchar un fragmento, sin prisa.',
    suggestion: 'Escuchar podcast de Tim Ferriss',
  },
  {
    title: 'Escuchar: Hábitos con James Clear',
    message: 'Si te interesa cuidar pequeños hábitos, busca episodios de James Clear en español.',
    suggestion: 'Buscar podcast de James Clear',
  },
  {
    title: 'Escuchar: Radio Ambulante',
    message: 'Historias en español, perfectas para caminar o viajar. Narrativa y reflexión.',
    suggestion: 'Escuchar Radio Ambulante',
  },
  {
    title: 'Escuchar: Entiende tu mente',
    message: 'Psicología y bienestar en español. Episodios de unos 30 min.',
    suggestion: 'Escuchar Entiende tu mente',
  },
  {
    title: 'Escuchar: Crear es vivir',
    message: 'Creatividad y proceso creativo. Inspiración suave para proyectos.',
    suggestion: 'Escuchar Crear es vivir',
  },
] as const;

export const CONCRETE_PODCASTS_EN = [
  {
    title: 'Listen: The Tim Ferriss Show',
    message: 'Conversations on habits, calm, and curiosity. A fragment is enough — no rush.',
    suggestion: 'Listen to Tim Ferriss podcast',
  },
  {
    title: 'Listen: Habits with James Clear',
    message: 'If gentle habits interest you, try James Clear episodes.',
    suggestion: 'Find James Clear podcast',
  },
  {
    title: 'Listen: How I Built This',
    message: 'Founder stories and reflection. Good for a walk.',
    suggestion: 'Listen to How I Built This',
  },
  {
    title: 'Listen: Ten Percent Happier',
    message: 'Mindfulness and wellbeing. Episodes around 30 minutes.',
    suggestion: 'Listen to Ten Percent Happier',
  },
  {
    title: 'Listen: Creative Pep Talk',
    message: 'Creativity and creative process. Soft inspiration for projects.',
    suggestion: 'Listen to Creative Pep Talk',
  },
] as const;

export const CONCRETE_BOOKS_ES = [
  {
    title: 'Leer: Hábitos atómicos (James Clear)',
    message: 'Pequeños cambios, sin presión. Útil si quieres cuidar rutinas a tu ritmo.',
    suggestion: 'Leer Hábitos atómicos',
  },
  {
    title: 'Leer: El poder del ahora (Eckhart Tolle)',
    message: 'Sobre presencia y calma. Recomendado cuando te sientes ansiosa.',
    suggestion: 'Leer El poder del ahora',
  },
  {
    title: 'Leer: El descanso importa (Alex Soojung-Kim Pang)',
    message: 'Descansar también cuenta. Sin culpa por pausar o ir más lento.',
    suggestion: 'Leer El descanso importa',
  },
  {
    title: 'Leer: El monje que vendió su Ferrari',
    message: 'Fábula sobre qué importa y sentido de vida. Lectura ligera.',
    suggestion: 'Leer El monje que vendió su Ferrari',
  },
  {
    title: 'Leer: La chica que limpió su armario (Marie Kondo)',
    message: 'Ordenar el espacio puede aliviar la mente. Un capítulo basta.',
    suggestion: 'Leer La chica que limpió su armario',
  },
] as const;

export const CONCRETE_BOOKS_EN = [
  {
    title: 'Read: Atomic Habits (James Clear)',
    message: 'Small changes, no pressure. Helpful if you want to tend routines at your pace.',
    suggestion: 'Read Atomic Habits',
  },
  {
    title: 'Read: The Power of Now (Eckhart Tolle)',
    message: 'On presence and calm. Helpful when you feel anxious.',
    suggestion: 'Read The Power of Now',
  },
  {
    title: 'Read: Rest (Alex Soojung-Kim Pang)',
    message: 'Rest counts too. No guilt for pausing or going slower.',
    suggestion: 'Read Rest',
  },
  {
    title: 'Read: The Alchemist',
    message: 'A light fable about meaning and what matters to you.',
    suggestion: 'Read The Alchemist',
  },
  {
    title: 'Read: The Life-Changing Magic of Tidying Up',
    message: 'Tidying space can ease the mind. One chapter is enough.',
    suggestion: 'Read Tidying Up',
  },
] as const;

export function getConcretePodcasts(locale: AppLocale) {
  return locale === 'en' ? CONCRETE_PODCASTS_EN : CONCRETE_PODCASTS_ES;
}

export function getConcreteBooks(locale: AppLocale) {
  return locale === 'en' ? CONCRETE_BOOKS_EN : CONCRETE_BOOKS_ES;
}

type RecCopy = {
  genericRestTitle: string;
  genericRestMsg: string;
  genericBreatheTitle: string;
  genericBreatheMsg: string;
  wellnessSleepTitle: string;
  wellnessSleepMsg: string;
  wellnessMoveTitle: string;
  wellnessMoveMsg: string;
  wellnessSelfTitle: string;
  wellnessSelfMsg: string;
  resumeActivity: (activity: string) => string;
  exploreInterest: (interest: string) => string;
  activityEnergy: (activity: string, energy: number) => string;
  activityGentle: (activity: string) => string;
  activityCreative: (activity: string) => string;
  activityCalm: (activity: string) => string;
  activitySocialLow: (activity: string, emotion: string) => string;
  activitySocialGood: (activity: string) => string;
  activityRest: (activity: string) => string;
  interestHighEnergy: (interest: string, emotion: string) => string;
  interestCalm: (interest: string) => string;
  interestDistraction: (interest: string) => string;
};

const COPY_ES: RecCopy = {
  genericRestTitle: 'Momento de descanso',
  genericRestMsg: 'Tu cuerpo te pide una pausa. El descanso puede ser lo más importante hoy.',
  genericBreatheTitle: 'Respiración consciente',
  genericBreatheMsg: 'Tómate 5 minutos para respirar profundamente. Puede ayudarte a calmar la mente.',
  wellnessSleepTitle: 'Cuida tu descanso',
  wellnessSleepMsg: 'Dormir bien ayuda a que el día se sienta más liviano. Si puedes, busca 7–9 horas.',
  wellnessMoveTitle: 'Movimiento suave',
  wellnessMoveMsg: 'Una caminata corta o estiramientos pueden ayudarte a recargar energía.',
  wellnessSelfTitle: 'Autocuidado',
  wellnessSelfMsg: 'Es importante escuchar a tu cuerpo. Tómate tiempo para descansar.',
  resumeActivity: (a) => `Retoma ${a}`,
  exploreInterest: (i) => `Explora ${i}`,
  activityEnergy: (a, e) => `Hace tiempo que no haces ${a}. Tu energía está en ${e}/5 — si te apetece, podría ser buen momento.`,
  activityGentle: (a) => `Una sesión suave de ${a} podría ayudarte a recargar energía.`,
  activityCreative: (a) => `Tu estado emocional encaja bien con ${a}, si te apetece.`,
  activityCalm: (a) => `${a} puede ayudarte a calmar la mente. Es una buena forma de relajarte.`,
  activitySocialLow: (a, e) => `Conectar con otros puede ayudarte cuando te sientes ${e}. Considera ${a}.`,
  activitySocialGood: (a) => `Podría ser buen momento para ${a}, si te apetece compartir.`,
  activityRest: (a) => `${a} puede ayudarte a recargar. Es momento de cuidarte.`,
  interestHighEnergy: (i, e) => `Tienes buena energía y te sientes ${e}. Si quieres, podrías explorar ${i}.`,
  interestCalm: (i) => `Tu calma encaja bien con ${i}, a tu ritmo.`,
  interestDistraction: (i) => `${i} puede ser una distracción amable para la mente.`,
};

const COPY_EN: RecCopy = {
  genericRestTitle: 'Time to rest',
  genericRestMsg: 'Your body is asking for a pause. Rest may be what matters most today.',
  genericBreatheTitle: 'Conscious breathing',
  genericBreatheMsg: 'Take 5 minutes to breathe deeply. It can help calm your mind.',
  wellnessSleepTitle: 'Care for your sleep',
  wellnessSleepMsg: 'Good sleep helps the day feel lighter. If you can, aim for 7–9 hours.',
  wellnessMoveTitle: 'Gentle movement',
  wellnessMoveMsg: 'A short walk or stretches can help you recharge.',
  wellnessSelfTitle: 'Self-care',
  wellnessSelfMsg: 'Listen to your body. Take time to rest.',
  resumeActivity: (a) => `Return to ${a}`,
  exploreInterest: (i) => `Explore ${i}`,
  activityEnergy: (a, e) => `It has been a while since ${a}. Your energy is ${e}/5 — if you feel like it, this could be a good moment.`,
  activityGentle: (a) => `A gentle ${a} session could help you recharge.`,
  activityCreative: (a) => `How you feel fits well with ${a}, if you are up for it.`,
  activityCalm: (a) => `${a} can help calm your mind. A good way to relax.`,
  activitySocialLow: (a, e) => `Connecting with others can help when you feel ${e}. Consider ${a}.`,
  activitySocialGood: (a) => `Could be a good time for ${a}, if you feel like sharing.`,
  activityRest: (a) => `${a} can help you recharge. Time to take care of yourself.`,
  interestHighEnergy: (i, e) => `You have good energy and feel ${e}. If you want, you could explore ${i}.`,
  interestCalm: (i) => `Your calm fits well with ${i}, at your pace.`,
  interestDistraction: (i) => `${i} can be a gentle distraction for the mind.`,
};

export function recCopy(locale: AppLocale): RecCopy {
  return locale === 'en' ? COPY_EN : COPY_ES;
}
