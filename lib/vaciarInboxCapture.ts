import type { AppLocale } from '@/lib/i18n';
import { fetchUserProjects } from '@/lib/projectDueDateSchema';
import type { TaskEffort } from '@/lib/taskPerceivedEffort';
import {
  isUserListCapture,
  parseTaskCaptureLocally,
} from '@/lib/taskCaptureParseLocal';
import type { VaciarBatchItem } from '@/lib/vaciarBatchDraft';
import { applyProjectToAllItems } from '@/lib/vaciarBatchDraft';
import {
  applyAiProjectHints,
  enrichCaptureItemsLocally,
  type EnrichedCaptureItem,
} from '@/lib/taskIntelligentEnrichment';

export type VaciarAdvancedCaptureOptions = {
  assignToProject: boolean;
  selectedCategory: string;
  selectedProjectId: string | null;
  selectedDate: string | null;
  effortFeel: TaskEffort | null;
};

function newId(): string {
  return `inbox-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Convierte texto en tareas inbox (sin categoría, proyecto ni peso). */
export function parseCaptureToInboxItems(rawInput: string, locale: AppLocale): VaciarBatchItem[] {
  const trimmed = rawInput.trim();
  if (!trimmed) return [];

  const parsed = parseTaskCaptureLocally(trimmed, locale);
  const rows = isUserListCapture(parsed)
    ? [parsed.main_task, ...parsed.prep_steps]
    : [parsed.main_task];

  return rows
    .filter((row) => row.content.trim())
    .map((row) => ({
      id: newId(),
      content: row.content.trim(),
      assignToProject: false,
      selectedCategory: '',
      selectedProjectId: null,
      selectedDate: row.scheduled_date,
      effortFeel: null,
    }));
}

export function advancedCaptureOptionsActive(options: VaciarAdvancedCaptureOptions): boolean {
  return (
    options.assignToProject ||
    Boolean(options.selectedDate) ||
    options.effortFeel != null ||
    (options.selectedCategory !== '' && options.selectedCategory !== 'otros')
  );
}

/** Aplica opciones avanzadas elegidas por la usuaria (power users). */
export function applyAdvancedCaptureOptions(
  items: VaciarBatchItem[],
  options: VaciarAdvancedCaptureOptions,
): VaciarBatchItem[] {
  if (!advancedCaptureOptionsActive(options) && !options.assignToProject) {
    return items;
  }

  let next = items.map((item) => ({
    ...item,
    assignToProject: options.assignToProject,
    selectedProjectId: options.assignToProject ? options.selectedProjectId : item.selectedProjectId,
    selectedCategory:
      options.selectedCategory && options.selectedCategory !== 'otros'
        ? options.selectedCategory
        : item.selectedCategory,
    selectedDate: options.selectedDate ?? item.selectedDate,
    effortFeel: options.effortFeel ?? item.effortFeel,
  }));

  if (options.assignToProject && options.selectedProjectId) {
    next = applyProjectToAllItems(next, options.selectedProjectId);
  }

  return next;
}

export function buildInboxReleaseItems(
  rawInput: string,
  locale: AppLocale,
  advanced?: VaciarAdvancedCaptureOptions,
): VaciarBatchItem[] {
  const items = parseCaptureToInboxItems(rawInput, locale);
  if (!advanced) return items;
  return applyAdvancedCaptureOptions(items, advanced);
}

/** Parsea, enriquece con Koraa (categoría, proyecto, cuándo, esfuerzo) y guarda listo. */
export async function buildEnrichedReleaseItems(
  rawInput: string,
  locale: AppLocale,
  userId: string | undefined,
  advanced?: VaciarAdvancedCaptureOptions,
): Promise<{
  items: EnrichedCaptureItem[];
  projectNamesById: Record<string, string>;
  projects: {
    id: string;
    name: string;
    due_date: string | null;
    color?: string | null;
    life_area_key?: string | null;
  }[];
}> {
  const base = buildInboxReleaseItems(rawInput, locale, advanced);
  if (base.length === 0) {
    return { items: [], projectNamesById: {}, projects: [] };
  }

  let projects: {
    id: string;
    name: string;
    due_date: string | null;
    color?: string | null;
    life_area_key?: string | null;
  }[] = [];
  if (userId) {
    const { data } = await fetchUserProjects(userId);
    projects = (data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      due_date: p.due_date ?? null,
      color: p.color ?? null,
      life_area_key: p.life_area_key ?? null,
    }));
  }
  const projectNamesById = Object.fromEntries(projects.map((p) => [p.id, p.name]));
  const projectsForMatch = projects.map((p) => ({ id: p.id, name: p.name }));

  let items = enrichCaptureItemsLocally(base, projectsForMatch);

  const userChoseOrganization = advanced && advancedCaptureOptionsActive(advanced);
  if (!userChoseOrganization) {
    items = await applyAiProjectHints(items, rawInput, locale, userId, projectsForMatch);
  }

  return { items, projectNamesById, projects };
}
