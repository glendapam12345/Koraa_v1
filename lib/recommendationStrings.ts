import type { AppLocale } from '@/lib/i18n';

export const CONCRETE_PODCASTS_ES = [
  { title: 'Escuchar: El podcast de Tim Ferriss', message: 'Episodios cortos sobre productividad y hábitos. Ideal para escuchar en movimiento.', suggestion: 'Escuchar podcast de Tim Ferriss' },
  { title: 'Escuchar: Hábitos con James Clear', message: 'Si te interesa mejorar hábitos, busca episodios de James Clear en español.', suggestion: 'Buscar podcast de James Clear' },
  { title: 'Escuchar: Radio Ambulante', message: 'Historias en español, perfectas para caminar o viajar. Narrativa y reflexión.', suggestion: 'Escuchar Radio Ambulante' },
  { title: 'Escuchar: Entiende tu mente', message: 'Psicología y bienestar en español. Episodios de unos 30 min.', suggestion: 'Escuchar Entiende tu mente' },
  { title: 'Escuchar: Crear es vivir', message: 'Creatividad y proceso creativo. Inspiración para proyectos.', suggestion: 'Escuchar Crear es vivir' },
] as const;

export const CONCRETE_PODCASTS_EN = [
  { title: 'Listen: The Tim Ferriss Show', message: 'Short episodes on productivity and habits. Great while moving.', suggestion: 'Listen to Tim Ferriss podcast' },
  { title: 'Listen: Habits with James Clear', message: 'If you want better habits, try James Clear episodes.', suggestion: 'Find James Clear podcast' },
  { title: 'Listen: How I Built This', message: 'Founder stories and reflection. Good for a walk.', suggestion: 'Listen to How I Built This' },
  { title: 'Listen: Ten Percent Happier', message: 'Mindfulness and wellbeing. Episodes around 30 minutes.', suggestion: 'Listen to Ten Percent Happier' },
  { title: 'Listen: Creative Pep Talk', message: 'Creativity and creative process. Inspiration for projects.', suggestion: 'Listen to Creative Pep Talk' },
] as const;

export const CONCRETE_BOOKS_ES = [
  { title: 'Leer: Hábitos atómicos (James Clear)', message: 'Pequeños cambios para grandes resultados. Muy práctico para productividad.', suggestion: 'Leer Hábitos atómicos' },
  { title: 'Leer: El poder del ahora (Eckhart Tolle)', message: 'Sobre presencia y calma. Recomendado cuando te sientes ansiosa.', suggestion: 'Leer El poder del ahora' },
  { title: 'Leer: Deep Work (Cal Newport)', message: 'Enfocarse sin distracciones. Ideal si tienes tiempo para concentrarte.', suggestion: 'Leer Deep Work' },
  { title: 'Leer: La semana laboral de 4 horas', message: 'Ideas sobre eficiencia y priorización. Inspira a hacer más con menos.', suggestion: 'Leer La semana laboral de 4 horas' },
  { title: 'Leer: El monje que vendió su Ferrari', message: 'Fábula sobre prioridades y sentido de vida. Lectura ligera.', suggestion: 'Leer El monje que vendió su Ferrari' },
] as const;

export const CONCRETE_BOOKS_EN = [
  { title: 'Read: Atomic Habits (James Clear)', message: 'Small changes, big results. Very practical for productivity.', suggestion: 'Read Atomic Habits' },
  { title: 'Read: The Power of Now (Eckhart Tolle)', message: 'On presence and calm. Helpful when you feel anxious.', suggestion: 'Read The Power of Now' },
  { title: 'Read: Deep Work (Cal Newport)', message: 'Focus without distractions. Ideal when you have time to concentrate.', suggestion: 'Read Deep Work' },
  { title: 'Read: The 4-Hour Workweek', message: 'Ideas on efficiency and prioritization. Do more with less.', suggestion: 'Read The 4-Hour Workweek' },
  { title: 'Read: The Alchemist', message: 'A light fable about priorities and meaning.', suggestion: 'Read The Alchemist' },
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
  genericRestMsg: 'Tu cuerpo te está pidiendo una pausa. Prioriza el descanso hoy.',
  genericBreatheTitle: 'Respiración consciente',
  genericBreatheMsg: 'Tómate 5 minutos para respirar profundamente. Puede ayudarte a calmar la mente.',
  wellnessSleepTitle: 'Prioriza el descanso',
  wellnessSleepMsg: 'A tu edad, el descanso es fundamental. Asegúrate de dormir 7-9 horas.',
  wellnessMoveTitle: 'Movimiento suave',
  wellnessMoveMsg: 'Una caminata corta o estiramientos pueden ayudarte a recargar energía.',
  wellnessSelfTitle: 'Autocuidado',
  wellnessSelfMsg: 'Es importante escuchar a tu cuerpo. Tómate tiempo para descansar.',
  resumeActivity: (a) => `Retoma ${a}`,
  exploreInterest: (i) => `Explora ${i}`,
  activityEnergy: (a, e) => `Hace tiempo que no haces ${a}. Tu energía está en ${e}/5, es buen momento para retomarla.`,
  activityGentle: (a) => `Una sesión suave de ${a} podría ayudarte a recargar energía.`,
  activityCreative: (a) => `Tu estado emocional es perfecto para ${a}. Aprovecha este momento.`,
  activityCalm: (a) => `${a} puede ayudarte a calmar la mente. Es una buena forma de relajarte.`,
  activitySocialLow: (a, e) => `Conectar con otros puede ayudarte cuando te sientes ${e}. Considera ${a}.`,
  activitySocialGood: (a) => `Es buen momento para ${a}. Tu estado emocional es ideal para compartir.`,
  activityRest: (a) => `${a} puede ayudarte a recargar. Es momento de cuidarte.`,
  interestHighEnergy: (i, e) => `Tienes energía alta y estás ${e}. Es buen momento para explorar ${i}.`,
  interestCalm: (i) => `Tu estado de calma es perfecto para dedicarte a ${i}.`,
  interestDistraction: (i) => `${i} puede ser una buena distracción positiva.`,
};

const COPY_EN: RecCopy = {
  genericRestTitle: 'Time to rest',
  genericRestMsg: 'Your body is asking for a pause. Prioritize rest today.',
  genericBreatheTitle: 'Conscious breathing',
  genericBreatheMsg: 'Take 5 minutes to breathe deeply. It can help calm your mind.',
  wellnessSleepTitle: 'Prioritize sleep',
  wellnessSleepMsg: 'At your age, rest is essential. Aim for 7–9 hours of sleep.',
  wellnessMoveTitle: 'Gentle movement',
  wellnessMoveMsg: 'A short walk or stretches can help you recharge.',
  wellnessSelfTitle: 'Self-care',
  wellnessSelfMsg: 'Listen to your body. Take time to rest.',
  resumeActivity: (a) => `Return to ${a}`,
  exploreInterest: (i) => `Explore ${i}`,
  activityEnergy: (a, e) => `It has been a while since ${a}. Your energy is ${e}/5—a good time to pick it up.`,
  activityGentle: (a) => `A gentle ${a} session could help you recharge.`,
  activityCreative: (a) => `Your emotional state is great for ${a}. Use this moment.`,
  activityCalm: (a) => `${a} can help calm your mind. A good way to relax.`,
  activitySocialLow: (a, e) => `Connecting with others can help when you feel ${e}. Consider ${a}.`,
  activitySocialGood: (a) => `A good time for ${a}. Your state is ideal for sharing.`,
  activityRest: (a) => `${a} can help you recharge. Time to take care of yourself.`,
  interestHighEnergy: (i, e) => `You have high energy and feel ${e}. A good time to explore ${i}.`,
  interestCalm: (i) => `Your calm state is perfect for ${i}.`,
  interestDistraction: (i) => `${i} can be a positive distraction.`,
};

export function recCopy(locale: AppLocale): RecCopy {
  return locale === 'en' ? COPY_EN : COPY_ES;
}
