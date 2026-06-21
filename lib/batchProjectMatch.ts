import type { VaciarBatchItem } from '@/lib/vaciarBatchDraft';

export type ProjectForMatch = {
  id: string;
  name: string;
};

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameTokens(name: string): string[] {
  return normalizeForMatch(name).split(' ').filter((token) => token.length >= 3);
}

/**
 * Sugiere un proyecto existente cuando el nombre aparece en el texto del paso
 * o hay coincidencia clara por palabras del nombre.
 */
export function matchProjectForTask(
  content: string,
  projects: ProjectForMatch[],
): string | null {
  const trimmed = content.trim();
  if (!trimmed || projects.length === 0) return null;

  const normContent = normalizeForMatch(trimmed);
  let best: { id: string; score: number } | null = null;

  for (const project of projects) {
    const normName = normalizeForMatch(project.name);
    if (!normName) continue;

    let score = 0;
    if (normContent.includes(normName)) {
      score = 100 + normName.length;
    } else {
      const tokens = nameTokens(project.name);
      if (tokens.length === 0) continue;
      const matched = tokens.filter((token) => normContent.includes(token));
      if (matched.length === tokens.length) {
        score = 55 + matched.join('').length;
      } else if (matched.length >= Math.ceil(tokens.length / 2)) {
        score = 35 + matched.join('').length;
      }
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { id: project.id, score };
    }
  }

  if (!best || best.score < 35) return null;
  return best.id;
}

/** Rellena proyecto sugerido solo en pasos que aún no tienen uno. */
export function assignSuggestedProjects(
  items: VaciarBatchItem[],
  projects: ProjectForMatch[],
): VaciarBatchItem[] {
  if (projects.length === 0) return items;

  return items.map((item) => {
    if (item.assignToProject && item.selectedProjectId) return item;

    const suggestedId = matchProjectForTask(item.content, projects);
    if (!suggestedId) return item;

    return {
      ...item,
      assignToProject: true,
      selectedProjectId: suggestedId,
    };
  });
}
