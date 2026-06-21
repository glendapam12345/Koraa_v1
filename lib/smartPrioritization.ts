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
  perceivedEffort?: 'light' | 'medium' | 'heavy';
}

export interface CheckInData {
  energyLevel: number; // 1-5
  emotion: string; // agotada, tranquila, ansiosa, motivada, abrumada, enfocada
  availableTime: string; // 'Poco (1-2hrs)', 'Medio (2-4hrs)', 'Bastante (4-6hrs)', 'Todo el día'
  focusLevel: string; // 'Muy distraída', 'Algo distraída', 'Normal', 'Enfocada', 'Súper enfocada'
}

export type SmartReasonKey =
  | 'reasonRecent'
  | 'reasonFitsTime'
  | 'reasonFitsTimeMed'
  | 'reasonTooLong'
  | 'reasonSimpleFocus'
  | 'reasonComplexFocus'
  | 'reasonComplexIdeal'
  | 'reasonMediumIdeal'
  | 'reasonCreative'
  | 'reasonAdmin'
  | 'reasonCreativeBad'
  | 'reasonBalance'
  | 'reasonNotInFocus';

const POSITIVE_REASON_KEYS: SmartReasonKey[] = [
  'reasonRecent',
  'reasonFitsTime',
  'reasonFitsTimeMed',
  'reasonSimpleFocus',
  'reasonComplexIdeal',
  'reasonMediumIdeal',
  'reasonCreative',
  'reasonAdmin',
  'reasonBalance',
];

const NEGATIVE_REASON_KEYS: SmartReasonKey[] = [
  'reasonTooLong',
  'reasonComplexFocus',
  'reasonCreativeBad',
];

export interface TaskScore {
  task: Task;
  score: number;
  reasons: string[];
  reasonKeys: SmartReasonKey[];
}

export interface PrioritizationPlan {
  prioritizedTasks: Task[];
  prioritizedIds: Set<string>;
  scoresById: Map<string, TaskScore>;
  orderedScores: TaskScore[];
  maxPriorityTasks: number;
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
export function getAvailableMinutesFromCheckIn(availableTime: string): number {
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
export function estimateTaskMinutes(task: Task): number {
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
  const perceived = task.perceivedEffort;
  if (perceived === 'light') return 'simple';
  if (perceived === 'heavy') return 'complex';
  if (perceived === 'medium') return 'medium';

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
  const reasonKeys: SmartReasonKey[] = [];

  const addReason = (key: SmartReasonKey) => {
    reasonKeys.push(key);
    reasons.push(translate(locale, `smart.${key}`));
  };
  
  // Factor 1: Energía → Número de tareas (ya se maneja en el límite)
  // Las tareas más recientes tienen un pequeño boost
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreation <= 1) {
    score += 10;
    addReason('reasonRecent');
  }
  
  // Factor 2: Tiempo disponible → Duración estimada
  const taskDuration = estimateTaskMinutes(task);
  const availableMinutes = getAvailableMinutesFromCheckIn(checkIn.availableTime);
  
  // Priorizar tareas que caben en el tiempo disponible
  if (taskDuration <= availableMinutes * 0.3) {
    score += 20;
    addReason('reasonFitsTime');
  } else if (taskDuration <= availableMinutes * 0.6) {
    score += 10;
    addReason('reasonFitsTimeMed');
  } else if (taskDuration > availableMinutes) {
    score -= 15;
    addReason('reasonTooLong');
  }
  
  // Factor 3: Enfoque → Complejidad
  const complexity = getTaskComplexity(task);
  const focusLevel = checkIn.focusLevel;

  if (isLowFocus(focusLevel)) {
    if (complexity === 'simple') {
      score += 25;
      addReason('reasonSimpleFocus');
    } else if (complexity === 'complex') {
      score -= 20;
      addReason('reasonComplexFocus');
    }
  } else if (isHighFocus(focusLevel)) {
    if (complexity === 'complex') {
      score += 25;
      addReason('reasonComplexIdeal');
    } else if (complexity === 'simple') {
      score += 5;
    }
  } else if (complexity === 'medium') {
    score += 15;
    addReason('reasonMediumIdeal');
  }
  
  // Factor 4: Emoción → Tipo de tarea
  const taskType = getTaskType(task);
  const emotion = checkIn.emotion.toLowerCase();
  
  // Emociones que favorecen tareas creativas
  if (['motivada', 'enfocada', 'tranquila'].includes(emotion)) {
    if (taskType === 'creative') {
      score += 20;
      addReason('reasonCreative');
    }
  }

  if (['agotada', 'ansiosa', 'abrumada'].includes(emotion)) {
    if (taskType === 'administrative' && complexity === 'simple') {
      score += 20;
      addReason('reasonAdmin');
    } else if (taskType === 'creative' && complexity === 'complex') {
      score -= 15;
      addReason('reasonCreativeBad');
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
      addReason('reasonBalance');
    } else if (categoryRatio > 0.6) {
      score -= 10; // Categoría sobre-representada
    }
  }

  return { task, score, reasons, reasonKeys };
}

/**
 * Plan completo de priorización (tareas + scores + razones por tarea).
 */
export function computePrioritizationPlan(
  tasks: Task[],
  checkIn: CheckInData,
  locale: AppLocale = 'es',
): PrioritizationPlan | null {
  const mainTasks = tasks.filter((t) => !t.is_completed && !t.parent_task_id);
  if (mainTasks.length === 0) return null;

  const categoryCounts = new Map<string, number>();
  mainTasks.forEach((task) => {
    const category = task.category || 'sin categoría';
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  });

  const taskScores: TaskScore[] = mainTasks.map((task) =>
    calculateTaskScore(task, checkIn, categoryCounts, locale),
  );
  taskScores.sort((a, b) => b.score - a.score);

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

  const availableMinutes = getAvailableMinutesFromCheckIn(checkIn.availableTime);
  const totalEstimatedTime = taskScores
    .slice(0, maxPriorityTasks)
    .reduce((sum, ts) => sum + estimateTaskMinutes(ts.task), 0);

  if (totalEstimatedTime > availableMinutes && maxPriorityTasks > 1) {
    let adjustedCount = maxPriorityTasks;
    let cumulativeTime = 0;

    for (let i = 0; i < taskScores.length && i < maxPriorityTasks; i++) {
      cumulativeTime += estimateTaskMinutes(taskScores[i].task);
      if (cumulativeTime > availableMinutes) {
        adjustedCount = Math.max(1, i);
        break;
      }
    }

    maxPriorityTasks = adjustedCount;
  }

  const prioritizedTasks = taskScores.slice(0, maxPriorityTasks).map((ts) => ts.task);
  const prioritizedIds = new Set(prioritizedTasks.map((t) => t.id));
  const scoresById = new Map(taskScores.map((ts) => [ts.task.id, ts]));

  return {
    prioritizedTasks,
    prioritizedIds,
    scoresById,
    orderedScores: taskScores,
    maxPriorityTasks,
  };
}

export interface TaskPriorityInsight {
  whyUp: string[];
  whyDown: string[];
}

function linesForKeys(keys: SmartReasonKey[], locale: AppLocale, max: number): string[] {
  return keys.slice(0, max).map((key) => translate(locale, `smart.${key}`));
}

/** Razones legibles para mostrar en la tarjeta de una tarea. */
export function getTaskPriorityInsight(
  taskId: string,
  plan: PrioritizationPlan | null,
  locale: AppLocale = 'es',
): TaskPriorityInsight {
  if (!plan) return { whyUp: [], whyDown: [] };

  const score = plan.scoresById.get(taskId);
  if (!score) return { whyUp: [], whyDown: [] };

  const isPriority = plan.prioritizedIds.has(taskId);
  const rank = plan.orderedScores.findIndex((ts) => ts.task.id === taskId);

  if (isPriority) {
    const positiveKeys = score.reasonKeys.filter((k) => POSITIVE_REASON_KEYS.includes(k));
    const whyUp =
      positiveKeys.length > 0
        ? linesForKeys(positiveKeys, locale, 2)
        : score.reasons.slice(0, 2);
    return { whyUp, whyDown: [] };
  }

  const negativeKeys = score.reasonKeys.filter((k) => NEGATIVE_REASON_KEYS.includes(k));
  if (negativeKeys.length > 0) {
    return { whyUp: [], whyDown: linesForKeys(negativeKeys, locale, 1) };
  }

  if (rank >= plan.maxPriorityTasks && rank < plan.maxPriorityTasks + 6) {
    return {
      whyUp: [],
      whyDown: [translate(locale, 'smart.reasonNotInFocus')],
    };
  }

  return { whyUp: [], whyDown: [] };
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
  const plan = computePrioritizationPlan(tasks, checkIn, locale);
  return plan?.prioritizedTasks ?? [];
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
    const availableMinutes = getAvailableMinutesFromCheckIn(checkIn.availableTime);
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

function getTimeShortLabel(availableTime: string, locale: AppLocale): string {
  const minutes = getAvailableMinutesFromCheckIn(availableTime);
  if (minutes < 120) return translate(locale, 'smart.timeShortLittle');
  if (minutes >= 300) return translate(locale, 'smart.timeShortPlenty');
  return translate(locale, 'smart.timeShortMedium');
}

function getFocusShortLabel(focusLevel: string, locale: AppLocale): string {
  if (isLowFocus(focusLevel)) return translate(locale, 'smart.focusShortLow');
  if (isHighFocus(focusLevel)) return translate(locale, 'smart.focusShortHigh');
  return translate(locale, 'smart.focusShortNormal');
}

/** Una línea compacta bajo el hero de Hoy (pasos sugeridos según check-in). */
export function buildHoyFocusSummaryLine(
  plan: PrioritizationPlan | null,
  checkIn: CheckInData,
  locale: AppLocale = 'es',
  emotionDisplayLabel?: string,
): string | null {
  if (!plan || plan.prioritizedIds.size === 0) return null;

  const count = plan.prioritizedIds.size;
  const emotions = getCatalog(locale).sentir.emotions as Record<string, string>;
  const emotionKey = checkIn.emotion.toLowerCase();
  const emotionLabel = emotionDisplayLabel ?? emotions[emotionKey] ?? checkIn.emotion;

  return translate(locale, 'hoy.focusSummaryLine', {
    count,
    steps: count === 1 ? translate(locale, 'hoy.focusOne') : translate(locale, 'hoy.focusMany'),
    n: checkIn.energyLevel,
    emotion: emotionLabel.toLowerCase(),
    time: getTimeShortLabel(checkIn.availableTime, locale),
    focus: getFocusShortLabel(checkIn.focusLevel, locale),
  });
}
