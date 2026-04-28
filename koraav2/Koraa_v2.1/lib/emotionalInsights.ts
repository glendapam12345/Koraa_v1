import { DayData } from '@/components/ProgressChart';

export interface EmotionalInsight {
  type: 'pattern' | 'trend' | 'milestone';
  message: string;
  emoji?: string;
}

/**
 * Analiza los datos de check-ins y genera insights emocionales simples y empáticos
 */
export function generateEmotionalInsights(
  progressData: DayData[],
  currentStreak: number
): EmotionalInsight[] {
  const insights: EmotionalInsight[] = [];

  // Filtrar solo días con check-in
  const checkIns = progressData.filter(day => day.hasCheckIn && day.emotion && day.energyLevel);

  if (checkIns.length === 0) {
    return [];
  }

  // 1. Emoción más frecuente
  const emotionCounts = new Map<string, number>();
  checkIns.forEach(day => {
    if (day.emotion) {
      emotionCounts.set(day.emotion, (emotionCounts.get(day.emotion) || 0) + 1);
    }
  });

  const mostFrequentEmotion = Array.from(emotionCounts.entries())
    .sort((a, b) => b[1] - a[1])[0];

  if (mostFrequentEmotion && mostFrequentEmotion[1] >= 3) {
    const emotionLabel = mostFrequentEmotion[0].charAt(0).toUpperCase() + mostFrequentEmotion[0].slice(1);
    insights.push({
      type: 'pattern',
      message: `Te has sentido mayormente ${emotionLabel.toLowerCase()} en estos días`,
      emoji: getEmotionEmoji(mostFrequentEmotion[0]),
    });
  }

  // 2. Nivel promedio de energía (sin números técnicos)
  const totalEnergy = checkIns.reduce((sum, day) => sum + (day.energyLevel || 0), 0);
  const avgEnergy = totalEnergy / checkIns.length;

  if (avgEnergy >= 4) {
    insights.push({
      type: 'trend',
      message: `¡Estás en un buen momento de energía! ✨`,
    });
  } else if (avgEnergy <= 2.5) {
    insights.push({
      type: 'trend',
      message: `Recuerda que está bien descansar cuando lo necesitas 💙`,
    });
  } else {
    insights.push({
      type: 'trend',
      message: `Tienes un balance saludable de energía 🌱`,
    });
  }

  // 3. Patrón por día de la semana (si hay suficientes datos)
  if (checkIns.length >= 7) {
    const dayOfWeekEnergy = new Map<number, number[]>();
    
    progressData.forEach(day => {
      if (day.hasCheckIn && day.energyLevel) {
        const date = new Date(day.date);
        const dayOfWeek = date.getDay();
        if (!dayOfWeekEnergy.has(dayOfWeek)) {
          dayOfWeekEnergy.set(dayOfWeek, []);
        }
        dayOfWeekEnergy.get(dayOfWeek)!.push(day.energyLevel);
      }
    });

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    // Encontrar el día con menor energía promedio
    let lowestEnergyDay = -1;
    let lowestEnergyAvg = 5;
    
    dayOfWeekEnergy.forEach((energies, dayOfWeek) => {
      if (energies.length >= 2) {
        const avg = energies.reduce((a, b) => a + b, 0) / energies.length;
        if (avg < lowestEnergyAvg) {
          lowestEnergyAvg = avg;
          lowestEnergyDay = dayOfWeek;
        }
      }
    });

    if (lowestEnergyDay !== -1 && lowestEnergyAvg < 3) {
      insights.push({
        type: 'pattern',
        message: `Notamos que los ${dayNames[lowestEnergyDay].toLowerCase()} sueles tener menos energía. Es normal tener días más tranquilos 💭`,
      });
    }
  }

  // 4. Tendencia semanal (comparar última semana vs semana anterior)
  if (checkIns.length >= 7) {
    const lastWeek = checkIns.slice(-7);
    const previousWeek = checkIns.slice(-14, -7);

    if (previousWeek.length >= 3) {
      const lastWeekAvg = lastWeek.reduce((sum, d) => sum + (d.energyLevel || 0), 0) / lastWeek.length;
      const prevWeekAvg = previousWeek.reduce((sum, d) => sum + (d.energyLevel || 0), 0) / previousWeek.length;

      if (lastWeekAvg > prevWeekAvg + 0.5) {
        insights.push({
          type: 'trend',
          message: `Esta semana tuviste más energía que la pasada. ¡Sigue así! 🌟`,
        });
      } else if (lastWeekAvg < prevWeekAvg - 0.5) {
        insights.push({
          type: 'trend',
          message: `Esta semana tu energía fue más baja. Recuerda que los ciclos son normales 💙`,
        });
      }
    }
  }

  // 5. Mejor día (más energía) - sin números técnicos
  const bestDay = checkIns.reduce((best, day) => {
    if (!best || (day.energyLevel || 0) > (best.energyLevel || 0)) {
      return day;
    }
    return best;
  }, checkIns[0] as DayData | undefined);

  if (bestDay && bestDay.energyLevel === 5) {
    const dayName = bestDay.dayLabel;
    insights.push({
      type: 'milestone',
      message: `Tu mejor día fue el ${dayName} ⚡`,
    });
  }

  // Limitar a máximo 3 insights para no saturar
  return insights.slice(0, 3);
}

export function getEmotionEmoji(emotion: string): string {
  const emotionLower = emotion.toLowerCase();
  switch (emotionLower) {
    case 'tranquila':
      return '😌';
    case 'enfocada':
      return '🎯';
    case 'motivada':
      return '✨';
    case 'ansiosa':
      return '😰';
    case 'agotada':
      return '😔';
    case 'abrumada':
      return '🥺';
    default:
      return '💭';
  }
}
