export interface EmotionTip {
  id: string;
  tip: string;
  category: 'rest' | 'action' | 'mindset' | 'productivity';
}

export const EMOTION_TIPS: Record<string, EmotionTip[]> = {
  agotada: [
    {
      id: 'agotada-1',
      tip: 'Es momento de descansar. Prioriza solo 1-2 tareas esenciales hoy',
      category: 'rest',
    },
    {
      id: 'agotada-2',
      tip: 'Respira profundo. Tu cuerpo te está pidiendo una pausa',
      category: 'mindset',
    },
    {
      id: 'agotada-3',
      tip: 'Recuerda: descansar también es productivo. No necesitas hacerlo todo',
      category: 'mindset',
    },
    {
      id: 'agotada-4',
      tip: 'Tareas pequeñas también cuentan. Empieza por la más fácil',
      category: 'productivity',
    },
  ],
  ansiosa: [
    {
      id: 'ansiosa-1',
      tip: 'Tómate 5 minutos para respirar antes de empezar',
      category: 'mindset',
    },
    {
      id: 'ansiosa-2',
      tip: 'Enfócate en una tarea a la vez. No necesitas hacerlo todo hoy',
      category: 'productivity',
    },
    {
      id: 'ansiosa-3',
      tip: 'Las tareas pequeñas también cuentan. Empieza por la más fácil',
      category: 'productivity',
    },
    {
      id: 'ansiosa-4',
      tip: 'Divide las tareas grandes en pasos pequeños. Respira entre cada paso',
      category: 'action',
    },
  ],
  motivada: [
    {
      id: 'motivada-1',
      tip: '¡Aprovecha esta energía! Prioriza tareas que requieren creatividad',
      category: 'productivity',
    },
    {
      id: 'motivada-2',
      tip: 'Este es el momento perfecto para proyectos importantes',
      category: 'action',
    },
    {
      id: 'motivada-3',
      tip: 'Equilibra: energía alta no significa hacerlo todo. Enfócate en lo esencial',
      category: 'mindset',
    },
    {
      id: 'motivada-4',
      tip: 'Mantén el ritmo pero no te agotes. Tómate pausas también',
      category: 'rest',
    },
  ],
  tranquila: [
    {
      id: 'tranquila-1',
      tip: 'Aprovecha esta calma para tareas que requieren enfoque',
      category: 'productivity',
    },
    {
      id: 'tranquila-2',
      tip: 'Es un buen día para decisiones importantes',
      category: 'action',
    },
    {
      id: 'tranquila-3',
      tip: 'Mantén este equilibrio. No necesitas acelerar',
      category: 'mindset',
    },
    {
      id: 'tranquila-4',
      tip: 'Este estado es perfecto para tareas que requieren claridad mental',
      category: 'productivity',
    },
  ],
  abrumada: [
    {
      id: 'abrumada-1',
      tip: 'Respira. Divide las tareas grandes en pasos pequeños',
      category: 'mindset',
    },
    {
      id: 'abrumada-2',
      tip: 'Prioriza solo lo esencial. El resto puede esperar',
      category: 'productivity',
    },
    {
      id: 'abrumada-3',
      tip: 'Pide ayuda si la necesitas. No tienes que hacerlo sola',
      category: 'mindset',
    },
    {
      id: 'abrumada-4',
      tip: 'Empieza por la tarea más pequeña. Un paso a la vez',
      category: 'action',
    },
  ],
  enfocada: [
    {
      id: 'enfocada-1',
      tip: 'Aprovecha este momento para tareas complejas',
      category: 'productivity',
    },
    {
      id: 'enfocada-2',
      tip: 'Mantén el foco. Evita distracciones',
      category: 'action',
    },
    {
      id: 'enfocada-3',
      tip: 'Este es tu momento de máximo rendimiento. Úsalo bien',
      category: 'productivity',
    },
    {
      id: 'enfocada-4',
      tip: 'Equilibra el trabajo con descansos. El enfoque sostenido es mejor',
      category: 'rest',
    },
  ],
};

export function getEmotionTips(emotion: string): EmotionTip[] {
  const emotionLower = emotion.toLowerCase();
  return EMOTION_TIPS[emotionLower] || [];
}

export function getRandomTip(emotion: string): EmotionTip | null {
  const tips = getEmotionTips(emotion);
  if (tips.length === 0) return null;
  return tips[Math.floor(Math.random() * tips.length)];
}
