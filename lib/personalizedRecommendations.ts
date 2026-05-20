/**
 * Motor de recomendaciones personalizadas basado en:
 * - Datos del perfil (edad, actividades favoritas, intereses)
 * - Estado emocional actual
 * - Contexto (tiempo disponible, energía, enfoque)
 */

import type { AppLocale } from '@/lib/i18n';
import { getConcreteBooks, getConcretePodcasts, recCopy } from '@/lib/recommendationStrings';

export interface UserPreferences {
  age?: number;
  favorite_activities?: string[];
  interests?: string[];
  other_preferences?: Record<string, any>;
}

export interface CheckInContext {
  emotion: string;
  energyLevel: number;
  availableTime: string;
  focusLevel: string;
}

export interface Recommendation {
  id: string;
  type: 'activity' | 'wellness' | 'social' | 'productivity';
  title: string;
  message: string;
  suggestion?: string; // Tarea sugerida opcional
  emoji: string;
  priority: number; // 1-5, mayor = más relevante
}

/**
 * Genera recomendaciones personalizadas basadas en perfil y contexto
 */
export function generatePersonalizedRecommendations(
  preferences: UserPreferences,
  checkIn: CheckInContext,
  locale: AppLocale = 'es',
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (!preferences || (!preferences.favorite_activities?.length && !preferences.interests?.length)) {
    return getGenericRecommendations(checkIn, locale);
  }

  const emotion = checkIn.emotion.toLowerCase();
  const energyLevel = checkIn.energyLevel;
  const availableTime = checkIn.availableTime;

  // Recomendaciones basadas en actividades favoritas
  if (preferences.favorite_activities && preferences.favorite_activities.length > 0) {
    const activityRecommendations = getActivityRecommendations(
      preferences.favorite_activities,
      emotion,
      energyLevel,
      availableTime,
      locale,
    );
    recommendations.push(...activityRecommendations);
  }

  // Recomendaciones basadas en intereses
  if (preferences.interests && preferences.interests.length > 0) {
    const interestRecommendations = getInterestRecommendations(
      preferences.interests,
      emotion,
      energyLevel,
      locale,
    );
    recommendations.push(...interestRecommendations);
  }

  // Recomendaciones basadas en edad (bienestar)
  if (preferences.age) {
    const wellnessRecommendations = getWellnessRecommendations(
      preferences.age,
      emotion,
      energyLevel,
      locale,
    );
    recommendations.push(...wellnessRecommendations);
  }

  // Añadir recomendaciones concretas (podcasts, libros) para dar opciones específicas
  const concreteRecs = getConcreteRecommendations(checkIn, locale);
  recommendations.push(...concreteRecs);

  // Ordenar por prioridad (mayor a menor)
  recommendations.sort((a, b) => b.priority - a.priority);

  // Retornar top 5 recomendaciones
  return recommendations.slice(0, 5);
}

/**
 * Recomendaciones concretas: podcasts y libros según contexto
 */
function getConcreteRecommendations(checkIn: CheckInContext, locale: AppLocale): Recommendation[] {
  const recs: Recommendation[] = [];
  const { energyLevel, availableTime } = checkIn;
  const time = availableTime?.toLowerCase() ?? '';
  const hasShortTime =
    time.includes('poco') || time.includes('little') || time.includes('1');
  const hasMoreTime =
    time.includes('medio') || time.includes('medium') || time.includes('2') || time.includes('4') || time.includes('plenty') || time.includes('bastante');

  if (hasShortTime || energyLevel <= 3) {
    const podcasts = getConcretePodcasts(locale);
    const pick = podcasts[Math.floor(Math.random() * podcasts.length)];
    recs.push({
      id: `concrete-podcast-${pick.title.slice(0, 15).replace(/\s/g, '-')}`,
      type: 'productivity',
      title: pick.title,
      message: pick.message,
      suggestion: pick.suggestion,
      emoji: '🎧',
      priority: 4,
    });
  }
  // Si tiene más tiempo o buena energía → libro
  if (hasMoreTime || energyLevel >= 3) {
    const books = getConcreteBooks(locale);
    const pick = books[Math.floor(Math.random() * books.length)];
    recs.push({
      id: `concrete-book-${pick.title.slice(0, 15).replace(/\s/g, '-')}`,
      type: 'productivity',
      title: pick.title,
      message: pick.message,
      suggestion: pick.suggestion,
      emoji: '📚',
      priority: 3,
    });
  }
  return recs;
}

/**
 * Recomendaciones basadas en actividades favoritas
 */
function getActivityRecommendations(
  activities: string[],
  emotion: string,
  energyLevel: number,
  availableTime: string,
  locale: AppLocale,
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const copy = recCopy(locale);
  void availableTime;

  activities.forEach((activity, index) => {
    const activityLower = activity.toLowerCase();
    
    // Determinar si la actividad es apropiada para el estado actual
    let isAppropriate = false;
    let message = '';
    let priority = 3;

    // Actividades físicas
    if (['yoga', 'ejercicio', 'gym', 'gimnasio', 'correr', 'caminar', 'nadar', 'deporte'].some(a => activityLower.includes(a))) {
      if (energyLevel >= 3 && !['agotada', 'abrumada'].includes(emotion)) {
        isAppropriate = true;
        message = copy.activityEnergy(activity, energyLevel);
        priority = energyLevel >= 4 ? 5 : 4;
      } else if (energyLevel <= 2 && ['agotada', 'abrumada'].includes(emotion)) {
        isAppropriate = true;
        message = copy.activityGentle(activity);
        priority = 3;
      }
    }

    // Actividades creativas
    if (['leer', 'libro', 'lectura', 'escribir', 'dibujar', 'pintar', 'música', 'cocinar', 'arte'].some(a => activityLower.includes(a))) {
      if (['motivada', 'tranquila', 'enfocada'].includes(emotion)) {
        isAppropriate = true;
        message = copy.activityCreative(activity);
        priority = 4;
      } else if (['ansiosa', 'abrumada'].includes(emotion)) {
        isAppropriate = true;
        message = copy.activityCalm(activity);
        priority = 4;
      }
    }

    // Actividades sociales
    if (['amigos', 'familia', 'social', 'reunión', 'cita'].some(a => activityLower.includes(a))) {
      if (['agotada', 'ansiosa', 'abrumada'].includes(emotion)) {
        isAppropriate = true;
        message = copy.activitySocialLow(activity, emotion);
        priority = 4;
      } else if (['motivada', 'tranquila'].includes(emotion)) {
        isAppropriate = true;
        message = copy.activitySocialGood(activity);
        priority = 3;
      }
    }

    // Actividades de relajación
    if (['meditación', 'meditar', 'relajación', 'masaje', 'spa', 'baño'].some(a => activityLower.includes(a))) {
      if (['agotada', 'ansiosa', 'abrumada'].includes(emotion) || energyLevel <= 2) {
        isAppropriate = true;
        message = copy.activityRest(activity);
        priority = 5;
      }
    }

    if (isAppropriate && message) {
      recommendations.push({
        id: `activity-${activity}-${index}`,
        type: 'activity',
        title: copy.resumeActivity(activity),
        message,
        suggestion: activity,
        emoji: getActivityEmoji(activity),
        priority,
      });
    }
  });

  return recommendations;
}

/**
 * Recomendaciones basadas en intereses
 */
function getInterestRecommendations(
  interests: string[],
  emotion: string,
  energyLevel: number,
  locale: AppLocale,
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const copy = recCopy(locale);

  interests.forEach((interest, index) => {
    const interestLower = interest.toLowerCase();
    let message = '';
    let priority = 3;

    // Intereses que requieren energía
    if (['viaje', 'viajar', 'aventura', 'deporte', 'actividad física'].some(i => interestLower.includes(i))) {
      if (energyLevel >= 4 && ['motivada', 'enfocada'].includes(emotion)) {
        message = copy.interestHighEnergy(interest, emotion);
        priority = 4;
      }
    }

    // Intereses creativos/mentales
    if (['música', 'arte', 'lectura', 'aprender', 'curso', 'estudio'].some(i => interestLower.includes(i))) {
      if (['tranquila', 'enfocada'].includes(emotion)) {
        message = copy.interestCalm(interest);
        priority = 4;
      } else if (['ansiosa', 'abrumada'].includes(emotion)) {
        message = copy.interestDistraction(interest);
        priority = 3;
      }
    }

    if (message) {
      recommendations.push({
        id: `interest-${interest}-${index}`,
        type: 'productivity',
        title: copy.exploreInterest(interest),
        message,
        emoji: getInterestEmoji(interest),
        priority,
      });
    }
  });

  return recommendations;
}

/**
 * Recomendaciones de bienestar basadas en edad
 */
function getWellnessRecommendations(
  age: number,
  emotion: string,
  energyLevel: number,
  locale: AppLocale,
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const copy = recCopy(locale);

  // Recomendaciones para diferentes rangos de edad
  if (age >= 18 && age <= 25) {
    if (energyLevel <= 2 || ['agotada', 'abrumada'].includes(emotion)) {
      recommendations.push({
        id: 'wellness-sleep-young',
        type: 'wellness',
        title: copy.wellnessSleepTitle,
        message: copy.wellnessSleepMsg,
        emoji: '😴',
        priority: 4,
      });
    }
  } else if (age >= 26 && age <= 35) {
    if (energyLevel <= 2) {
      recommendations.push({
        id: 'wellness-exercise-adult',
        type: 'wellness',
        title: copy.wellnessMoveTitle,
        message: copy.wellnessMoveMsg,
        emoji: '🚶',
        priority: 3,
      });
    }
  } else if (age >= 36) {
    if (['agotada', 'abrumada'].includes(emotion)) {
      recommendations.push({
        id: 'wellness-self-care',
        type: 'wellness',
        title: copy.wellnessSelfTitle,
        message: copy.wellnessSelfMsg,
        emoji: '💆',
        priority: 5,
      });
    }
  }

  return recommendations;
}

/**
 * Recomendaciones genéricas cuando no hay datos personales
 */
function getGenericRecommendations(checkIn: CheckInContext, locale: AppLocale): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const emotion = checkIn.emotion.toLowerCase();
  const energyLevel = checkIn.energyLevel;
  const copy = recCopy(locale);

  if (energyLevel <= 2 || ['agotada', 'abrumada'].includes(emotion)) {
    recommendations.push({
      id: 'generic-rest',
      type: 'wellness',
      title: copy.genericRestTitle,
      message: copy.genericRestMsg,
      emoji: '😌',
      priority: 5,
    });
  }

  if (['ansiosa', 'abrumada'].includes(emotion)) {
    recommendations.push({
      id: 'generic-breathe',
      type: 'wellness',
      title: copy.genericBreatheTitle,
      message: copy.genericBreatheMsg,
      emoji: '🧘',
      priority: 4,
    });
  }

  // Siempre incluir al menos una recomendación concreta (podcast o libro)
  const concrete = getConcreteRecommendations(checkIn, locale);
  recommendations.push(...concrete);

  return recommendations;
}

/**
 * Obtiene emoji para actividad
 */
function getActivityEmoji(activity: string): string {
  const activityLower = activity.toLowerCase();
  if (activityLower.includes('yoga') || activityLower.includes('meditación')) return '🧘';
  if (activityLower.includes('ejercicio') || activityLower.includes('gym')) return '💪';
  if (activityLower.includes('correr') || activityLower.includes('caminar')) return '🏃';
  if (activityLower.includes('leer') || activityLower.includes('libro')) return '📚';
  if (activityLower.includes('cocinar')) return '👨‍🍳';
  if (activityLower.includes('música')) return '🎵';
  if (activityLower.includes('arte') || activityLower.includes('dibujar')) return '🎨';
  return '✨';
}

/**
 * Obtiene emoji para interés
 */
function getInterestEmoji(interest: string): string {
  const interestLower = interest.toLowerCase();
  if (interestLower.includes('música')) return '🎵';
  if (interestLower.includes('viaje')) return '✈️';
  if (interestLower.includes('lectura') || interestLower.includes('libro')) return '📚';
  if (interestLower.includes('arte')) return '🎨';
  if (interestLower.includes('deporte')) return '⚽';
  if (interestLower.includes('fotografía')) return '📷';
  return '🌟';
}
