import type { AppLocale } from '@/lib/i18n';
import { EMOTION_TIPS_EN } from '@/lib/i18n/locales/emotionTips.en';

export interface EmotionTip {
  id: string;
  tip: string;
  category: 'rest' | 'action' | 'mindset' | 'productivity';
}

export const EMOTION_TIPS: Record<string, EmotionTip[]> = {
  agotada: [
    {
      id: 'agotada-1',
      tip: 'Hoy puede ser un día corto: 1–2 cosas pequeñas bastan',
      category: 'rest',
    },
    {
      id: 'agotada-2',
      tip: 'Respira profundo. Tu cuerpo te está pidiendo una pausa',
      category: 'mindset',
    },
    {
      id: 'agotada-3',
      tip: 'Descansar también cuenta. No necesitas hacerlo todo',
      category: 'mindset',
    },
    {
      id: 'agotada-4',
      tip: 'Lo pequeño también vale. Empieza por lo más fácil',
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
      tip: 'Una cosa a la vez. No necesitas hacerlo todo hoy',
      category: 'productivity',
    },
    {
      id: 'ansiosa-3',
      tip: 'Lo pequeño también vale. Empieza por lo más fácil',
      category: 'productivity',
    },
    {
      id: 'ansiosa-4',
      tip: 'Divide lo grande en pasos pequeños. Respira entre cada uno',
      category: 'action',
    },
  ],
  motivada: [
    {
      id: 'motivada-1',
      tip: 'Si te apetece, canaliza esta energía en una cosa que importe',
      category: 'productivity',
    },
    {
      id: 'motivada-2',
      tip: 'Buen momento para algo que te importe — sin apurarte',
      category: 'action',
    },
    {
      id: 'motivada-3',
      tip: 'Energía alta no significa hacerlo todo. Un paso basta',
      category: 'mindset',
    },
    {
      id: 'motivada-4',
      tip: 'Mantén el ritmo pero no te agotes. Las pausas también cuentan',
      category: 'rest',
    },
  ],
  tranquila: [
    {
      id: 'tranquila-1',
      tip: 'Esta calma puede servir para una cosa que pida claridad',
      category: 'productivity',
    },
    {
      id: 'tranquila-2',
      tip: 'Buen día para una decisión pequeña, sin prisa',
      category: 'action',
    },
    {
      id: 'tranquila-3',
      tip: 'Mantén este equilibrio. No necesitas acelerar',
      category: 'mindset',
    },
    {
      id: 'tranquila-4',
      tip: 'Con tranquilidad, una cosa con calma puede ser suficiente',
      category: 'productivity',
    },
  ],
  abrumada: [
    {
      id: 'abrumada-1',
      tip: 'Respira. Divide lo grande en pasos pequeños',
      category: 'mindset',
    },
    {
      id: 'abrumada-2',
      tip: 'Solo lo esencial hoy. El resto puede esperar',
      category: 'productivity',
    },
    {
      id: 'abrumada-3',
      tip: 'Pide ayuda si la necesitas. No tienes que hacerlo sola',
      category: 'mindset',
    },
    {
      id: 'abrumada-4',
      tip: 'Empieza por lo más pequeño. Un paso a la vez',
      category: 'action',
    },
  ],
  enfocada: [
    {
      id: 'enfocada-1',
      tip: 'Si te apetece, podrías abordar algo un poco más profundo',
      category: 'productivity',
    },
    {
      id: 'enfocada-2',
      tip: 'Protege este momento: menos interrupciones, más calma',
      category: 'action',
    },
    {
      id: 'enfocada-3',
      tip: 'Un paso con calma vale más que hacerlo todo de golpe',
      category: 'productivity',
    },
    {
      id: 'enfocada-4',
      tip: 'Alterna con descansos. El ritmo sostenible gana',
      category: 'rest',
    },
  ],
};

export function getEmotionTips(emotion: string, locale: AppLocale = 'es'): EmotionTip[] {
  const emotionLower = emotion.toLowerCase();
  const catalog = locale === 'en' ? EMOTION_TIPS_EN : EMOTION_TIPS;
  return catalog[emotionLower] || [];
}

export function getRandomTip(emotion: string, locale: AppLocale = 'es'): EmotionTip | null {
  const tips = getEmotionTips(emotion, locale);
  if (tips.length === 0) return null;
  return tips[Math.floor(Math.random() * tips.length)];
}
