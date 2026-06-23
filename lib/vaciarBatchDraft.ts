import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';
import type { AppLocale } from '@/lib/i18n';
import { detectCategory } from '@/lib/categoryDetection';
import type { TaskEffort } from '@/lib/taskPerceivedEffort';
import type { TaskCaptureResult } from '@/lib/taskCaptureTypes';
import type { CapturePriority } from '@/lib/review/capturePriority';
import { capturePriorityToIsPriority } from '@/lib/review/capturePriority';
import {
  isMultiTaskListInput,
  parseTaskCaptureLocally,
} from '@/lib/taskCaptureParseLocal';

export type VaciarBatchItem = {
  id: string;
  content: string;
  assignToProject: boolean;
  selectedCategory: string;
  selectedProjectId: string | null;
  selectedDate: string | null;
  effortFeel: TaskEffort | null;
  lifeAreaKey?: LifeAreaRef | null;
  /** Duración estimada en minutos (p. ej. 25 para un bloque de foco). */
  estimatedMinutes?: number | null;
  /** Hora del día preferida (`HH:mm`, 24h). */
  preferredTime?: string | null;
};

export type VaciarBatchDefaults = {
  assignToProject: boolean;
  selectedCategory: string;
  selectedProjectId: string | null;
  selectedDate: string | null;
  effortFeel: TaskEffort | null;
};

function newId(): string {
  return `batch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Koraa infiere categoría, fecha y peso por paso — sin copiar un solo bloque a todos. */
function rowToBatchItem(
  content: string,
  scheduledDate: string | null,
  effort: TaskEffort | null,
  projectId?: string | null,
  estimatedMinutes?: number | null,
): VaciarBatchItem {
  const hasProject = Boolean(projectId);
  const resolvedEffort = effort;
  return {
    id: newId(),
    content: content.trim(),
    assignToProject: hasProject,
    selectedCategory: detectCategory(content) || 'otros',
    selectedProjectId: projectId ?? null,
    selectedDate: scheduledDate,
    effortFeel: resolvedEffort,
    estimatedMinutes: estimatedMinutes ?? null,
  };
}

export function captureResultToBatchItems(capture: TaskCaptureResult): VaciarBatchItem[] {
  const rows = [capture.main_task, ...capture.prep_steps].filter((row) => row.content.trim());
  return rows.map((row) =>
    rowToBatchItem(
      row.content,
      row.scheduled_date,
      (row.effort as TaskEffort | null | undefined) ?? null,
      row.project_id ?? null,
      row.estimated_minutes ?? null,
    ),
  );
}

export function parseInputToBatchItems(rawInput: string, locale: AppLocale): VaciarBatchItem[] {
  const trimmed = rawInput.trim();
  if (!trimmed || !isMultiTaskListInput(trimmed, locale)) return [];

  const parsed = parseTaskCaptureLocally(trimmed, locale);
  return captureResultToBatchItems(parsed);
}

/** Solo si el usuario elige explícitamente un proyecto para todo el lote. */
export function applyProjectToAllItems(
  items: VaciarBatchItem[],
  projectId: string | null,
): VaciarBatchItem[] {
  if (!projectId) return items;
  return items.map((item) => ({
    ...item,
    assignToProject: true,
    selectedProjectId: projectId,
  }));
}

export function batchItemToDraft(
  item: VaciarBatchItem & { markImportant?: boolean; capturePriority?: CapturePriority | null },
) {
  const isPriority =
    Boolean(item.markImportant) || capturePriorityToIsPriority(item.capturePriority);
  return {
    content: item.content,
    hasSubtasks: false as const,
    subtasks: [] as string[],
    assignToProject: item.assignToProject,
    selectedCategory: item.selectedCategory,
    selectedProjectId: item.selectedProjectId,
    selectedDate: item.selectedDate,
    isPriority,
    lifeAreaKey: item.lifeAreaKey ?? null,
  };
}
