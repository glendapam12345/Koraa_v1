/**
 * Algoritmo de priorización inteligente que considera:
 * - Energía: Número de tareas
 * - Tiempo disponible: Duración estimada
 * - Enfoque: Complejidad de tareas
 * - Emoción: Tipo de tareas (creativas vs administrativas)
 * - Balance: Distribución entre categorías
 */

export interface Task {
  id: string;
  content: string;
  category: string;
  is_completed: boolean;
  parent_task_id: string | null;
  created_at?: string;
  subtasks?: Task[];
}

export interface CheckInData {
  energyLevel: number; // 1-5
  emotion: string; // agotada, tranquila, ansiosa, motivada, abrumada, enfocada
  availableTime: string; // 'Poco (1-2hrs)', 'Medio (2-4hrs)', 'Bastante (4-6hrs)', 'Todo el día'
  focusLevel: string; // 'Muy distraída', 'Algo distraída', 'Normal', 'Enfocada', 'Súper enfocada'
}

export interface TaskScore {
  task: Task;
  score: number;
  reasons: string[];
}

/**
 * Convierte tiempo disponible a minutos estimados
 */
function getTimeInMinutes(availableTime: string): number {
  switch (availableTime) {
    case 'Poco (1-2hrs)':
      return 90; // 1.5 horas promedio
    case 'Medio (2-4hrs)':
      return 180; // 3 horas promedio
    case 'Bastante (4-6hrs)':
      return 300; // 5 horas promedio
    case 'Todo el día':
      return 480; // 8 horas
    default:
      return 180; // Default: 3 horas
  }
}

/**
 * Estima la duración de una tarea basado en su contenido
 * (heurística simple basada en palabras clave y longitud)
 */
function estimateTaskDuration(task: Task): number {
  const content = task.content.toLowerCase();
  const wordCount = task.content.split(' ').length;
  
  // Tareas con subtareas requieren más tiempo
  if (task.subtasks && task.subtasks.length > 0) {
    return 60 + (task.subtasks.length * 15); // Base 60min + 15min por subtarea
  }
  
  // Palabras clave que indican tareas rápidas (< 30 min)
  const quickKeywords = ['llamar', 'enviar', 'revisar', 'confirmar', 'responder', 'agendar'];
  if (quickKeywords.some(keyword => content.includes(keyword)) || wordCount < 5) {
    return 15; // 15 minutos
  }
  
  // Palabras clave que indican tareas medianas (30-60 min)
  const mediumKeywords = ['escribir', 'preparar', 'organizar', 'planear', 'revisar documento'];
  if (mediumKeywords.some(keyword => content.includes(keyword)) || (wordCount >= 5 && wordCount < 15)) {
    return 45; // 45 minutos
  }
  
  // Palabras clave que indican tareas largas (> 60 min)
  const longKeywords = ['crear', 'desarrollar', 'diseñar', 'proyecto', 'presentación', 'reporte'];
  if (longKeywords.some(keyword => content.includes(keyword)) || wordCount >= 15) {
    return 90; // 90 minutos
  }
  
  // Default: tarea mediana
  return 45;
}

/**
 * Determina la complejidad de una tarea basado en su contenido
 */
function getTaskComplexity(task: Task): 'simple' | 'medium' | 'complex' {
  const content = task.content.toLowerCase();
  const wordCount = task.content.split(' ').length;
  
  // Tareas con subtareas son más complejas
  if (task.subtasks && task.subtasks.length > 0) {
    return task.subtasks.length > 3 ? 'complex' : 'medium';
  }
  
  // Palabras clave simples
  const simpleKeywords = ['llamar', 'enviar', 'confirmar', 'revisar email'];
  if (simpleKeywords.some(keyword => content.includes(keyword)) || wordCount < 5) {
    return 'simple';
  }
  
  // Palabras clave complejas
  const complexKeywords = ['crear', 'desarrollar', 'diseñar', 'proyecto', 'estrategia', 'plan'];
  if (complexKeywords.some(keyword => content.includes(keyword)) || wordCount >= 15) {
    return 'complex';
  }
  
  return 'medium';
}

/**
 * Determina si una tarea es creativa o administrativa basado en su contenido
 */
function getTaskType(task: Task): 'creative' | 'administrative' | 'neutral' {
  const content = task.content.toLowerCase();
  
  // Tareas creativas
  const creativeKeywords = ['crear', 'diseñar', 'escribir', 'idear', 'brainstorm', 'proyecto creativo'];
  if (creativeKeywords.some(keyword => content.includes(keyword))) {
    return 'creative';
  }
  
  // Tareas administrativas
  const adminKeywords = ['llamar', 'enviar', 'confirmar', 'revisar', 'organizar', 'agendar', 'pagar', 'factura'];
  if (adminKeywords.some(keyword => content.includes(keyword))) {
    return 'administrative';
  }
  
  return 'neutral';
}

/**
 * Calcula el score de priorización para una tarea
 */
function calculateTaskScore(
  task: Task,
  checkIn: CheckInData,
  categoryCounts: Map<string, number>
): TaskScore {
  let score = 0;
  const reasons: string[] = [];
  
  // Factor 1: Energía → Número de tareas (ya se maneja en el límite)
  // Las tareas más recientes tienen un pequeño boost
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreation <= 1) {
    score += 10;
    reasons.push('Tarea reciente');
  }
  
  // Factor 2: Tiempo disponible → Duración estimada
  const taskDuration = estimateTaskDuration(task);
  const availableMinutes = getTimeInMinutes(checkIn.availableTime);
  
  // Priorizar tareas que caben en el tiempo disponible
  if (taskDuration <= availableMinutes * 0.3) {
    score += 20; // Tareas rápidas que caben fácilmente
    reasons.push('Tarea rápida que cabe en tu tiempo');
  } else if (taskDuration <= availableMinutes * 0.6) {
    score += 10; // Tareas medianas
    reasons.push('Tarea que cabe en tu tiempo');
  } else if (taskDuration > availableMinutes) {
    score -= 15; // Tareas que no caben
    reasons.push('Tarea muy larga para tu tiempo disponible');
  }
  
  // Factor 3: Enfoque → Complejidad
  const complexity = getTaskComplexity(task);
  const focusLevel = checkIn.focusLevel.toLowerCase();
  
  if (focusLevel.includes('muy distraída') || focusLevel.includes('algo distraída')) {
    // Bajo enfoque: priorizar tareas simples
    if (complexity === 'simple') {
      score += 25;
      reasons.push('Tarea simple para tu nivel de enfoque');
    } else if (complexity === 'complex') {
      score -= 20;
      reasons.push('Tarea compleja para tu nivel de enfoque actual');
    }
  } else if (focusLevel.includes('enfocada') || focusLevel.includes('súper enfocada')) {
    // Alto enfoque: priorizar tareas complejas
    if (complexity === 'complex') {
      score += 25;
      reasons.push('Tarea compleja ideal para tu nivel de enfoque');
    } else if (complexity === 'simple') {
      score += 5; // Tareas simples también funcionan
    }
  } else {
    // Enfoque normal: balance
    if (complexity === 'medium') {
      score += 15;
      reasons.push('Tarea de complejidad media ideal');
    }
  }
  
  // Factor 4: Emoción → Tipo de tarea
  const taskType = getTaskType(task);
  const emotion = checkIn.emotion.toLowerCase();
  
  // Emociones que favorecen tareas creativas
  if (['motivada', 'enfocada', 'tranquila'].includes(emotion)) {
    if (taskType === 'creative') {
      score += 20;
      reasons.push('Tarea creativa ideal para tu estado emocional');
    }
  }
  
  // Emociones que favorecen tareas administrativas simples
  if (['agotada', 'ansiosa', 'abrumada'].includes(emotion)) {
    if (taskType === 'administrative' && complexity === 'simple') {
      score += 20;
      reasons.push('Tarea administrativa simple ideal para tu estado');
    } else if (taskType === 'creative' && complexity === 'complex') {
      score -= 15;
      reasons.push('Tarea creativa compleja no ideal para tu estado');
    }
  }
  
  // Factor 5: Balance entre categorías
  const category = task.category || 'sin categoría';
  const currentCategoryCount = categoryCounts.get(category) || 0;
  
  // Priorizar categorías que están menos representadas
  const totalTasks = Array.from(categoryCounts.values()).reduce((a, b) => a + b, 0);
  if (totalTasks > 0) {
    const categoryRatio = currentCategoryCount / totalTasks;
    if (categoryRatio < 0.3) {
      score += 15; // Categoría poco representada
      reasons.push('Balance de categorías');
    } else if (categoryRatio > 0.6) {
      score -= 10; // Categoría sobre-representada
    }
  }
  
  return { task, score, reasons };
}

/**
 * Algoritmo principal de priorización inteligente
 */
export function prioritizeTasksIntelligently(
  tasks: Task[],
  checkIn: CheckInData
): Task[] {
  if (tasks.length === 0) return [];
  
  // Filtrar solo tareas no completadas y principales (sin parent_task_id)
  const mainTasks = tasks.filter(t => !t.is_completed && !t.parent_task_id);
  
  if (mainTasks.length === 0) return [];
  
  // Contar tareas por categoría para balance
  const categoryCounts = new Map<string, number>();
  mainTasks.forEach(task => {
    const category = task.category || 'sin categoría';
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  });
  
  // Calcular scores para cada tarea
  const taskScores: TaskScore[] = mainTasks.map(task =>
    calculateTaskScore(task, checkIn, categoryCounts)
  );
  
  // Ordenar por score (mayor a menor)
  taskScores.sort((a, b) => b.score - a.score);
  
  // Determinar número máximo de tareas según energía y emoción
  const negativeEmotions = ['agotada', 'ansiosa', 'abrumada'];
  const isNegativeEmotion = negativeEmotions.includes(checkIn.emotion.toLowerCase());
  
  let maxPriorityTasks = 4;
  if (checkIn.energyLevel <= 2 || isNegativeEmotion) {
    maxPriorityTasks = 2;
  } else if (checkIn.energyLevel === 3) {
    maxPriorityTasks = 3;
  } else if (checkIn.energyLevel >= 4) {
    maxPriorityTasks = 5;
  }
  
  // Ajustar según tiempo disponible
  const availableMinutes = getTimeInMinutes(checkIn.availableTime);
  const totalEstimatedTime = taskScores
    .slice(0, maxPriorityTasks)
    .reduce((sum, ts) => sum + estimateTaskDuration(ts.task), 0);
  
  // Si las tareas seleccionadas exceden el tiempo, reducir cantidad
  if (totalEstimatedTime > availableMinutes && maxPriorityTasks > 1) {
    // Reducir hasta que quepan en el tiempo disponible
    let adjustedCount = maxPriorityTasks;
    let cumulativeTime = 0;
    
    for (let i = 0; i < taskScores.length && i < maxPriorityTasks; i++) {
      cumulativeTime += estimateTaskDuration(taskScores[i].task);
      if (cumulativeTime > availableMinutes) {
        adjustedCount = Math.max(1, i); // Al menos 1 tarea
        break;
      }
    }
    
    maxPriorityTasks = adjustedCount;
  }
  
  // Seleccionar las mejores tareas
  const prioritizedTasks = taskScores
    .slice(0, maxPriorityTasks)
    .map(ts => ts.task);
  
  return prioritizedTasks;
}

/**
 * Genera explicación del por qué se priorizaron estas tareas
 */
export function generatePrioritizationExplanation(
  prioritizedTasks: Task[],
  checkIn: CheckInData,
  allTasks: Task[]
): {
  message: string;
  reasoning: string;
  suggestion: string;
} {
  const emotionLabel = checkIn.emotion.charAt(0).toUpperCase() + checkIn.emotion.slice(1);
  const priorityCount = prioritizedTasks.length;
  
  let message = `Te sugerimos enfocarte en ${priorityCount} ${priorityCount === 1 ? 'tarea esencial' : 'tareas esenciales'} hoy.`;
  
  const reasons: string[] = [];
  
  // Razones basadas en energía
  if (checkIn.energyLevel <= 2) {
    reasons.push(`Con energía ${checkIn.energyLevel}/5`);
  } else if (checkIn.energyLevel >= 4) {
    reasons.push(`Con energía alta (${checkIn.energyLevel}/5)`);
  } else {
    reasons.push(`Con energía moderada (${checkIn.energyLevel}/5)`);
  }
  
  // Razones basadas en emoción
  reasons.push(`sintiéndote ${emotionLabel.toLowerCase()}`);
  
  // Razones basadas en tiempo (si está disponible)
  if (checkIn.availableTime) {
    const availableMinutes = getTimeInMinutes(checkIn.availableTime);
    if (availableMinutes < 120) {
      reasons.push('y poco tiempo disponible');
    } else if (availableMinutes >= 300) {
      reasons.push('y bastante tiempo disponible');
    }
  }
  
  // Razones basadas en enfoque (si está disponible)
  if (checkIn.focusLevel) {
    const focusLevel = checkIn.focusLevel.toLowerCase();
    if (focusLevel.includes('muy distraída') || focusLevel.includes('algo distraída')) {
      reasons.push('con bajo nivel de enfoque');
    } else if (focusLevel.includes('enfocada') || focusLevel.includes('súper enfocada')) {
      reasons.push('con alto nivel de enfoque');
    }
  }
  
  const reasoning = reasons.join(', ') + ', priorizamos estas tareas.';
  
  // Suggestion
  let suggestion = '';
  if (checkIn.energyLevel <= 2 || ['agotada', 'ansiosa', 'abrumada'].includes(checkIn.emotion.toLowerCase())) {
    suggestion = 'Menos es más cuando tu energía está baja. Enfócate en lo esencial.';
  } else if (checkIn.energyLevel >= 4) {
    suggestion = '¡Tienes energía para más! Aprovecha este momento.';
  } else {
    suggestion = 'Tienes energía moderada. Prioriza lo importante.';
  }
  
  return { message, reasoning, suggestion };
}
