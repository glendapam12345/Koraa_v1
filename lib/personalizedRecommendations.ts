/**
 * Motor de recomendaciones personalizadas basado en:
 * - Datos del perfil (edad, actividades favoritas, intereses)
 * - Estado emocional actual
 * - Contexto (tiempo disponible, energía, enfoque)
 */

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
  checkIn: CheckInContext
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (!preferences || (!preferences.favorite_activities?.length && !preferences.interests?.length)) {
    // Si no hay datos personales, retornar recomendaciones genéricas
    return getGenericRecommendations(checkIn);
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
      availableTime
    );
    recommendations.push(...activityRecommendations);
  }

  // Recomendaciones basadas en intereses
  if (preferences.interests && preferences.interests.length > 0) {
    const interestRecommendations = getInterestRecommendations(
      preferences.interests,
      emotion,
      energyLevel
    );
    recommendations.push(...interestRecommendations);
  }

  // Recomendaciones basadas en edad (bienestar)
  if (preferences.age) {
    const wellnessRecommendations = getWellnessRecommendations(
      preferences.age,
      emotion,
      energyLevel
    );
    recommendations.push(...wellnessRecommendations);
  }

  // Ordenar por prioridad (mayor a menor)
  recommendations.sort((a, b) => b.priority - a.priority);

  // Retornar top 5 recomendaciones
  return recommendations.slice(0, 5);
}

/**
 * Recomendaciones basadas en actividades favoritas
 */
function getActivityRecommendations(
  activities: string[],
  emotion: string,
  energyLevel: number,
  availableTime: string
): Recommendation[] {
  const recommendations: Recommendation[] = [];

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
        message = `Hace tiempo que no haces ${activity}. Tu energía está en ${energyLevel}/5, es buen momento para retomarla.`;
        priority = energyLevel >= 4 ? 5 : 4;
      } else if (energyLevel <= 2 && ['agotada', 'abrumada'].includes(emotion)) {
        isAppropriate = true;
        message = `Una sesión suave de ${activity} podría ayudarte a recargar energía.`;
        priority = 3;
      }
    }

    // Actividades creativas
    if (['leer', 'libro', 'lectura', 'escribir', 'dibujar', 'pintar', 'música', 'cocinar', 'arte'].some(a => activityLower.includes(a))) {
      if (['motivada', 'tranquila', 'enfocada'].includes(emotion)) {
        isAppropriate = true;
        message = `Tu estado emocional es perfecto para ${activity}. Aprovecha este momento.`;
        priority = 4;
      } else if (['ansiosa', 'abrumada'].includes(emotion)) {
        isAppropriate = true;
        message = `${activity} puede ayudarte a calmar la mente. Es una buena forma de relajarte.`;
        priority = 4;
      }
    }

    // Actividades sociales
    if (['amigos', 'familia', 'social', 'reunión', 'cita'].some(a => activityLower.includes(a))) {
      if (['agotada', 'ansiosa', 'abrumada'].includes(emotion)) {
        isAppropriate = true;
        message = `Conectar con otros puede ayudarte cuando te sientes ${emotion}. Considera ${activity}.`;
        priority = 4;
      } else if (['motivada', 'tranquila'].includes(emotion)) {
        isAppropriate = true;
        message = `Es buen momento para ${activity}. Tu estado emocional es ideal para compartir.`;
        priority = 3;
      }
    }

    // Actividades de relajación
    if (['meditación', 'meditar', 'relajación', 'masaje', 'spa', 'baño'].some(a => activityLower.includes(a))) {
      if (['agotada', 'ansiosa', 'abrumada'].includes(emotion) || energyLevel <= 2) {
        isAppropriate = true;
        message = `${activity} puede ayudarte a recargar. Es momento de cuidarte.`;
        priority = 5;
      }
    }

    if (isAppropriate && message) {
      recommendations.push({
        id: `activity-${activity}-${index}`,
        type: 'activity',
        title: `Retoma ${activity}`,
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
  energyLevel: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  interests.forEach((interest, index) => {
    const interestLower = interest.toLowerCase();
    let message = '';
    let priority = 3;

    // Intereses que requieren energía
    if (['viaje', 'viajar', 'aventura', 'deporte', 'actividad física'].some(i => interestLower.includes(i))) {
      if (energyLevel >= 4 && ['motivada', 'enfocada'].includes(emotion)) {
        message = `Tienes energía alta y estás ${emotion}. Es buen momento para explorar ${interest}.`;
        priority = 4;
      }
    }

    // Intereses creativos/mentales
    if (['música', 'arte', 'lectura', 'aprender', 'curso', 'estudio'].some(i => interestLower.includes(i))) {
      if (['tranquila', 'enfocada'].includes(emotion)) {
        message = `Tu estado de calma es perfecto para dedicarte a ${interest}.`;
        priority = 4;
      } else if (['ansiosa', 'abrumada'].includes(emotion)) {
        message = `${interest} puede ser una buena distracción positiva.`;
        priority = 3;
      }
    }

    if (message) {
      recommendations.push({
        id: `interest-${interest}-${index}`,
        type: 'productivity',
        title: `Explora ${interest}`,
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
  energyLevel: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Recomendaciones para diferentes rangos de edad
  if (age >= 18 && age <= 25) {
    if (energyLevel <= 2 || ['agotada', 'abrumada'].includes(emotion)) {
      recommendations.push({
        id: 'wellness-sleep-young',
        type: 'wellness',
        title: 'Prioriza el descanso',
        message: 'A tu edad, el descanso es fundamental. Asegúrate de dormir 7-9 horas.',
        emoji: '😴',
        priority: 4,
      });
    }
  } else if (age >= 26 && age <= 35) {
    if (energyLevel <= 2) {
      recommendations.push({
        id: 'wellness-exercise-adult',
        type: 'wellness',
        title: 'Movimiento suave',
        message: 'Una caminata corta o estiramientos pueden ayudarte a recargar energía.',
        emoji: '🚶',
        priority: 3,
      });
    }
  } else if (age >= 36) {
    if (['agotada', 'abrumada'].includes(emotion)) {
      recommendations.push({
        id: 'wellness-self-care',
        type: 'wellness',
        title: 'Autocuidado',
        message: 'Es importante escuchar a tu cuerpo. Tómate tiempo para descansar.',
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
function getGenericRecommendations(checkIn: CheckInContext): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const emotion = checkIn.emotion.toLowerCase();
  const energyLevel = checkIn.energyLevel;

  if (energyLevel <= 2 || ['agotada', 'abrumada'].includes(emotion)) {
    recommendations.push({
      id: 'generic-rest',
      type: 'wellness',
      title: 'Momento de descanso',
      message: 'Tu cuerpo te está pidiendo una pausa. Prioriza el descanso hoy.',
      emoji: '😌',
      priority: 5,
    });
  }

  if (['ansiosa', 'abrumada'].includes(emotion)) {
    recommendations.push({
      id: 'generic-breathe',
      type: 'wellness',
      title: 'Respiración consciente',
      message: 'Tómate 5 minutos para respirar profundamente. Puede ayudarte a calmar la mente.',
      emoji: '🧘',
      priority: 4,
    });
  }

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
