import type { AppLocale } from '@/lib/i18n';
import { detectCategory } from '@/lib/categoryDetection';
import { getLocalDateString, getEndOfWeekLocalDateString } from '@/lib/dateLocal';
import { matchProjectForTask, type ProjectForMatch } from '@/lib/batchProjectMatch';
import { isUserListCapture } from '@/lib/taskCaptureParseLocal';
import type { VaciarBatchItem } from '@/lib/vaciarBatchDraft';
import type { TaskEffort } from '@/lib/taskPerceivedEffort';
import type { CapturePriority } from '@/lib/review/capturePriority';
import { clampEstimatedMinutes } from '@/lib/taskPlanningMeta';
import { inferEstimatedMinutesFromText } from '@/lib/inferTaskEstimatedMinutes';

export type TimingBucket = 'today' | 'this_week' | 'later';

export type EnrichedCaptureItem = VaciarBatchItem & {
  timing: TimingBucket;
  /** Marcar como paso importante al guardar (is_priority). */
  markImportant?: boolean;
  /** Prioridad explícita en revisión — urgente siempre va a is_priority. */
  capturePriority?: CapturePriority | null;
  /** Fuerza agrupación en un frente durante revisión (p. ej. koraa, loose). */
  frontKeyOverride?: string | null;
  /** Usuario pidió crear proyecto al guardar, aunque sea una sola tarea. */
  createProjectOnSave?: boolean;
  /** Orden manual dentro del frente (menor = más arriba / más prioridad). */
  captureRank?: number;
};

export type ReleaseSummaryLine = {
  content: string;
  categoryKey: string;
  projectName: string | null;
  timing: TimingBucket;
};

function inferEffortFromText(text: string): TaskEffort {
  const lower = text.toLowerCase();
  if (
    /\b(pitch|preparar pitch|prepare pitch|estrategia|strategy|investigar|research|planificar|planear|roadmap|propuesta|deck|presentación larga)\b/.test(
      lower,
    )
  ) {
    return 'heavy';
  }
  if (/\b(urgente|urgent|crucial|importante|important)\b/.test(lower) && !isTodayErrand(lower)) {
    return 'heavy';
  }
  if (
    /\b(ligera|ligero|light|small|pequeñ|llamar|call|comprar|buy|pagar|pay|mandar|enviar email|email)\b/.test(
      lower,
    )
  ) {
    return 'light';
  }
  return 'medium';
}

/** Trámites, llamadas y recados — conviene hacerlos hoy. */
function isTodayErrand(lower: string): boolean {
  return /\b(llamar|call|telefonear|marcar|comprar|buy|super|mercado|farmacia|pagar|pay|factura|recibo|renta|luz|agua|internet|sat|hacienda|imss|infonavit|tramite|trámite|notaria|notaría|dentista|doctor|médico|medico|cita|appointment|vet|veterinario|banco|deposito|depósito|transferir|recoger|correo)\b/i.test(
    lower,
  );
}

/** Comunicación rápida — email al cliente, WhatsApp, responder hoy. */
function isQuickCommunication(lower: string): boolean {
  if (/\b(propuesta|deck|pitch|informe|presentación|presentation|borrador|draft|estrategia|strategy)\b/i.test(lower)) {
    return false;
  }
  return (
    /\b(email|correo|e-mail|mail|whatsapp|slack|telegram|responder|reply|contestar|mensaje)\b/i.test(
      lower,
    ) ||
    /\b(mandar|enviar)\s+(un\s+)?(email|correo|mail|mensaje)\b/i.test(lower) ||
    /\b(email|correo|mail|mensaje)\s+(al|a|para)\s+(cliente|client|proveedor|equipo|jefe|socio|inversor|investor)\b/i.test(
      lower,
    )
  );
}

/** Trabajo profundo o estratégico — bloquear después, sin fecha fija. */
function isLaterDeepWork(lower: string, effort: TaskEffort | null): boolean {
  if (effort === 'heavy') return true;
  return /\b(pitch|preparar|prepare|diseño|design|escribir|write|planificar|plan|estrategia|strategy|investigar|research|propuesta|deck|presentación|presentation|borrador|draft|arquitectura|architecture|refactor|lanzamiento|launch)\b/i.test(
    lower,
  );
}

/** Admin de la semana — no urge hoy, pero no es proyecto largo. */
function isThisWeekAdmin(lower: string): boolean {
  return /\b(reporte|report|revisar|review|seguimiento|follow up|follow-up|actualizar|update|sincronizar|sync|equipo|team|semanal|weekly|status|pendiente de|check in)\b/i.test(
    lower,
  );
}

/** Cuándo tiene sentido abordar el paso — sin que la usuaria elija fecha. */
export function inferTimingBucket(content: string, effort: TaskEffort | null): TimingBucket {
  const lower = content.toLowerCase();

  if (/\b(hoy|today|ya|ahora|now|asap|antes de las|esta tarde|this afternoon|esta mañana|this morning)\b/.test(lower)) {
    return 'today';
  }

  if (isTodayErrand(lower)) return 'today';

  if (isQuickCommunication(lower)) return 'today';

  if (/\b(urgente|urgent)\b/.test(lower) && !isLaterDeepWork(lower, effort)) {
    return 'today';
  }

  if (isLaterDeepWork(lower, effort)) return 'later';

  if (isThisWeekAdmin(lower)) return 'this_week';

  if (effort === 'light') return 'today';
  if (effort === 'medium') return 'this_week';
  return 'later';
}

export function dateForTimingBucket(bucket: TimingBucket): string | null {
  if (bucket === 'today') return getLocalDateString();
  // "Esta semana" es un momento, no un día concreto (evitar domingo/lunes inventados).
  if (bucket === 'this_week') return null;
  return null;
}

/** Si el texto trae fecha explícita (viernes, mañana, 2026-06-20), respétala para el timing. */
export function inferTimingFromDate(isoDate: string, now: Date = new Date()): TimingBucket {
  const today = getLocalDateString(now);
  if (isoDate <= today) return 'today';
  const endOfWeek = getEndOfWeekLocalDateString(now);
  if (isoDate <= endOfWeek) return 'this_week';
  return 'later';
}

/** Koraa infiere categoría, proyecto, esfuerzo y momento — sin preguntar. */
export function enrichCaptureItem(
  item: VaciarBatchItem,
  projects: ProjectForMatch[],
): EnrichedCaptureItem {
  const effort = item.effortFeel ?? inferEffortFromText(item.content);
  const category = item.selectedCategory || detectCategory(item.content) || 'otros';
  const projectId =
    item.assignToProject && item.selectedProjectId
      ? item.selectedProjectId
      : matchProjectForTask(item.content, projects);

  const timing = item.selectedDate
    ? inferTimingFromDate(item.selectedDate)
    : inferTimingBucket(item.content, effort);
  const scheduledDate = item.selectedDate ?? dateForTimingBucket(timing);

  return {
    ...item,
    selectedCategory: category,
    effortFeel: effort,
    assignToProject: Boolean(projectId),
    selectedProjectId: projectId,
    selectedDate: scheduledDate,
    timing,
    estimatedMinutes: item.estimatedMinutes ?? null,
  };
}

export function enrichCaptureItemsLocally(
  items: VaciarBatchItem[],
  projects: ProjectForMatch[],
): EnrichedCaptureItem[] {
  return items.map((item, index) => ({
    ...enrichCaptureItem(item, projects),
    captureRank: index * 10,
  }));
}

export type ApplyAiProjectHintsResult = {
  items: EnrichedCaptureItem[];
  /** true si la IA estaba activa pero se usó parseo local (sin red o error). */
  usedLocalFallback: boolean;
};

/** IA opcional: proyecto y tiempo estimado cuando el match local no alcanza. */
export async function applyAiProjectHints(
  items: EnrichedCaptureItem[],
  rawInput: string,
  locale: AppLocale,
  userId: string | undefined,
  projects: ProjectForMatch[],
): Promise<ApplyAiProjectHintsResult> {
  if (!userId) return { items, usedLocalFallback: false };

  const { interpretTaskCapture, isTaskCaptureAiEnabled } = await import('@/lib/taskCaptureAi');
  const aiEnabled = isTaskCaptureAiEnabled();
  let result;
  try {
    result = await interpretTaskCapture(userId, {
      rawText: rawInput.trim().slice(0, 500),
      locale,
      projects,
    });
  } catch {
    return { items, usedLocalFallback: false };
  }
  if (!result || !isUserListCapture(result)) {
    return { items, usedLocalFallback: false };
  }

  const aiRows = [result.main_task, ...result.prep_steps];
  const validIds = new Set(projects.map((p) => p.id));

  const nextItems = items.map((item, index) => {
    const aiRow = aiRows[index];
    if (!aiRow) return item;

    let next = item;
    const aiProjectId = aiRow.project_id;
    if (!item.selectedProjectId && aiProjectId && validIds.has(aiProjectId)) {
      next = {
        ...next,
        assignToProject: true,
        selectedProjectId: aiProjectId,
      };
    }

    if (aiRow.estimated_minutes != null && aiRow.estimated_minutes > 0) {
      next = {
        ...next,
        estimatedMinutes: clampEstimatedMinutes(aiRow.estimated_minutes),
      };
    }

    return next;
  });

  return {
    items: nextItems,
    usedLocalFallback: aiEnabled && !result.fromAi,
  };
}

export function toReleaseSummaryLines(
  items: EnrichedCaptureItem[],
  projectNamesById: Record<string, string>,
): ReleaseSummaryLine[] {
  return items.map((item) => ({
    content: item.content,
    categoryKey: item.selectedCategory || 'otros',
    projectName: item.selectedProjectId
      ? projectNamesById[item.selectedProjectId] ?? null
      : null,
    timing: item.timing,
  }));
}
