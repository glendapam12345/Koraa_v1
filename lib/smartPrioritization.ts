import { type AppLocale, getCatalog, translate } from '@/lib/i18n';

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
  created_at: string;
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

const QUICK_KEYWORDS = [
  'llamar', 'enviar', 'revisar', 'confirmar', 'responder', 'agendar',
  'call', 'phone', 'send', 'email', 'reply', 'schedule', 'book', 'confirm', 'review',
  'text', 'message',
];

const MEDIUM_KEYWORDS = [
  'escribir', 'preparar', 'organizar', 'planear', 'revisar documento',
  'write', 'draft', 'prepare', 'organize', 'plan', 'document',
];

const LONG_KEYWORDS = [
  'crear', 'desarrollar', 'diseñar', 'proyecto', 'presentación', 'reporte',
  'create', 'develop', 'design', 'project', 'presentation', 'report', 'build',
];

const SIMPLE_KEYWORDS = [
  'llamar', 'enviar', 'confirmar', 'revisar email',
  'call', 'send', 'confirm', 'check email', 'reply',
];

const COMPLEX_KEYWORDS = [
  'crear', 'desarrollar', 'diseñar', 'proyecto', 'estrategia', 'plan',
  'create', 'develop', 'design', 'project', 'strategy', 'roadmap',
];

const CREATIVE_KEYWORDS = [
  'crear', 'diseñar', 'escribir', 'idear', 'brainstorm', 'proyecto creativo',
  'create', 'design', 'write', 'brainstorm', 'creative', 'sketch', 'draft',
];

const ADMIN_KEYWORDS = [
  'llamar', 'enviar', 'confirmar', 'revisar', 'organizar', 'agendar', 'pagar', 'factura',
  'call', 'send', 'confirm', 'review', 'organize', 'schedule', 'pay', 'invoice', 'bill',
];

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function isLowFocus(focusLevel: string): boolean {
  const f = focusLevel.toLowerCase();
  return (
    f.includes('muy distraída') ||
    f.includes('algo distraída') ||
    f.includes('very scattered') ||
    f.includes('somewhat scattered')
  );
}

function isHighFocus(focusLevel: string): boolean {
  const f = focusLevel.toLowerCase();
  return (
    f.includes('enfocada') ||
    f.includes('súper enfocada') ||
    f.includes('super enfocada') ||
    f.includes('very focused') ||
    (f.includes('focused') && !f.includes('scattered'))
  );
}

/**
 * Convierte tiempo disponible a minutos estimados
 */
function getTimeInMinutes(availableTime: string): number {
  switch (availableTime) {
    case 'Poco (1-2hrs)':
    case 'Little (1-2hrs)':
      return 90;
    case 'Medio (2-4hrs)':
    case 'Medium (2-4hrs)':
      return 180;
    case 'Bastante (4-6hrs)':
    case 'Plenty (4-6hrs)':
      return 300;
    case 'Todo el día':
    case 'All day':
      return 480;
    default:
      return 180;
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
  
  if (includesAny(content, QUICK_KEYWORDS) || wordCount < 5) {
    return 15;
  }

  if (includesAny(content, MEDIUM_KEYWORDS) || (wordCount >= 5 && wordCount < 15)) {
    return 45;
  }

  if (includesAny(content, LONG_KEYWORDS) || wordCount >= 15) {
    return 90;
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
  
  if (includesAny(content, SIMPLE_KEYWORDS) || wordCount < 5) {
    return 'simple';
  }

  if (includesAny(content, COMPLEX_KEYWORDS) || wordCount >= 15) {
    return 'complex';
  }
  
  return 'medium';
}

/**
 * Determina si una tarea es creativa o administrativa basado en su contenido
 */
function getTaskType(task: Task): 'creative' | 'administrative' | 'neutral' {
  const content = task.content.toLowerCase();
  
  if (includesAny(content, CREATIVE_KEYWORDS)) {
    return 'creative';
  }

  if (includesAny(content, ADMIN_KEYWORDS)) {
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
  categoryCounts: Map<string, number>,
  locale: AppLocale,
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
    reasons.push(translate(locale, 'smart.reasonRecent'));
  }
  
  // Factor 2: Tiempo disponible → Duración estimada
  const taskDuration = estimateTaskDuration(task);
  const availableMinutes = getTimeInMinutes(checkIn.availableTime);
  
  // Priorizar tareas que caben en el tiempo disponible
  if (taskDuration <= availableMinutes * 0.3) {
    score += 20;
    reasons.push(translate(locale, 'smart.reasonFitsTime'));
  } else if (taskDuration <= availableMinutes * 0.6) {
    score += 10;
    reasons.push(translate(locale, 'smart.reasonFitsTimeMed'));
  } else if (taskDuration > availableMinutes) {
    score -= 15;
    reasons.push(translate(locale, 'smart.reasonTooLong'));
  }
  
  // Factor 3: Enfoque → Complejidad
  const complexity = getTaskComplexity(task);
  const focusLevel = checkIn.focusLevel;

  if (isLowFocus(focusLevel)) {
    if (complexity === 'simple') {
      score += 25;
      reasons.push(translate(locale, 'smart.reasonSimpleFocus'));
    } else if (complexity === 'complex') {
      score -= 20;
      reasons.push(translate(locale, 'smart.reasonComplexFocus'));
    }
  } else if (isHighFocus(focusLevel)) {
    if (complexity === 'complex') {
      score += 25;
      reasons.push(translate(locale, 'smart.reasonComplexIdeal'));
    } else if (complexity === 'simple') {
      score += 5;
    }
  } else if (complexity === 'medium') {
    score += 15;
    reasons.push(translate(locale, 'smart.reasonMediumIdeal'));
  }
  
  // Factor 4: Emoción → Tipo de tarea
  const taskType = getTaskType(task);
  const emotion = checkIn.emotion.toLowerCase();
  
  // Emociones que favorecen tareas creativas
  if (['motivada', 'enfocada', 'tranquila'].includes(emotion)) {
    if (taskType === 'creative') {
      score += 20;
      reasons.push(translate(locale, 'smart.reasonCreative'));
    }
  }

  if (['agotada', 'ansiosa', 'abrumada'].includes(emotion)) {
    if (taskType === 'administrative' && complexity === 'simple') {
      score += 20;
      reasons.push(translate(locale, 'smart.reasonAdmin'));
    } else if (taskType === 'creative' && complexity === 'complex') {
      score -= 15;
      reasons.push(translate(locale, 'smart.reasonCreativeBad'));
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
      score += 15;
      reasons.push(translate(locale, 'smart.reasonBalance'));
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
  checkIn: CheckInData,
  locale: AppLocale = 'es',
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
  const taskScores: TaskScore[] = mainTasks.map((task) =>
    calculateTaskScore(task, checkIn, categoryCounts, locale),
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
  _allTasks: Task[],
  locale: AppLocale = 'es',
  emotionDisplayLabel?: string,
): {
  message: string;
  reasoning: string;
  suggestion: string;
} {
  const emotionKey = checkIn.emotion.toLowerCase();
  const emotions = getCatalog(locale).sentir.emotions as Record<string, string>;
  const emotionLabel = emotionDisplayLabel ?? emotions[emotionKey] ?? checkIn.emotion;
  const priorityCount = prioritizedTasks.length;

  const message = translate(locale, 'smart.messageEssential', {
    count: priorityCount,
    tasks:
      priorityCount === 1
        ? translate(locale, 'smart.taskEssential')
        : translate(locale, 'smart.tasksEssential'),
  });

  const reasons: string[] = [];

  if (checkIn.energyLevel <= 2) {
    reasons.push(translate(locale, 'smart.energyLow', { n: checkIn.energyLevel }));
  } else if (checkIn.energyLevel >= 4) {
    reasons.push(translate(locale, 'smart.energyHigh', { n: checkIn.energyLevel }));
  } else {
    reasons.push(translate(locale, 'smart.energyMid', { n: checkIn.energyLevel }));
  }

  reasons.push(translate(locale, 'smart.feeling', { emotion: emotionLabel.toLowerCase() }));

  if (checkIn.availableTime) {
    const availableMinutes = getTimeInMinutes(checkIn.availableTime);
    if (availableMinutes < 120) {
      reasons.push(translate(locale, 'smart.littleTime'));
    } else if (availableMinutes >= 300) {
      reasons.push(translate(locale, 'smart.plentyTime'));
    }
  }

  if (checkIn.focusLevel) {
    if (isLowFocus(checkIn.focusLevel)) {
      reasons.push(translate(locale, 'smart.lowFocus'));
    } else if (isHighFocus(checkIn.focusLevel)) {
      reasons.push(translate(locale, 'smart.highFocus'));
    }
  }

  const reasoning = reasons.join(', ') + translate(locale, 'smart.reasoningSuffix');

  let suggestion = '';
  if (checkIn.energyLevel <= 2 || ['agotada', 'ansiosa', 'abrumada'].includes(emotionKey)) {
    suggestion = translate(locale, 'smart.suggestLow');
  } else if (checkIn.energyLevel >= 4) {
    suggestion = translate(locale, 'smart.suggestHigh');
  } else {
    suggestion = translate(locale, 'smart.suggestMid');
  }

  return { message, reasoning, suggestion };
}

/** Textos cortos para la UI “cómo prioriza Koraa”. */
export function getPrioritizationExplainerBullets(locale: AppLocale = 'es'): string[] {
  return [
    translate(locale, 'smart.bullet1'),
    translate(locale, 'smart.bullet2'),
    translate(locale, 'smart.bullet3'),
    translate(locale, 'smart.bullet4'),
    translate(locale, 'smart.bullet5'),
  ];
}
