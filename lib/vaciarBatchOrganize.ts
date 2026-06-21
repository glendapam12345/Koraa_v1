import type { AppLocale } from '@/lib/i18n';
import { assignSuggestedProjects } from '@/lib/batchProjectMatch';
import { fetchUserProjects } from '@/lib/projectDueDateSchema';
import { interpretTaskCapture } from '@/lib/taskCaptureAi';
import {
  isMultiTaskListInput,
  isUserListCapture,
} from '@/lib/taskCaptureParseLocal';
import {
  captureResultToBatchItems,
  parseInputToBatchItems,
  type VaciarBatchItem,
} from '@/lib/vaciarBatchDraft';

type OrganizeBatchOptions = {
  energyLevel?: number;
  emotionKey?: string;
};

/** Separa una lista, infiere categoría/proyecto/fecha y devuelve pasos listos para guardar. */
export async function organizeBatchFromInput(
  rawInput: string,
  locale: AppLocale,
  userId: string | undefined,
  options?: OrganizeBatchOptions,
): Promise<VaciarBatchItem[]> {
  const trimmed = rawInput.trim();
  if (!trimmed || !isMultiTaskListInput(trimmed, locale)) return [];

  let projectsForMatch: { id: string; name: string }[] = [];
  if (userId) {
    const { data } = await fetchUserProjects(userId);
    projectsForMatch = (data ?? []).map((p) => ({ id: p.id, name: p.name }));
  }

  const result = await interpretTaskCapture(userId, {
    rawText: trimmed,
    locale,
    energyLevel: options?.energyLevel,
    emotionKey: options?.emotionKey,
    projects: projectsForMatch,
  });

  const rawItems =
    result && isUserListCapture(result)
      ? captureResultToBatchItems(result)
      : parseInputToBatchItems(trimmed, locale);

  return assignSuggestedProjects(rawItems, projectsForMatch);
}
