const MAX_TASK_LENGTH = 300;

import type { LifeAreaRef } from '@/lib/lifeAreas/lifeAreaCatalog';

export type VaciarTaskDraft = {
  content: string;
  hasSubtasks: boolean;
  subtasks: string[];
  assignToProject: boolean;
  selectedCategory: string;
  selectedProjectId: string | null;
  selectedDate: string | null;
  isPriority?: boolean;
  /** Área de vida para tareas sueltas (sin proyecto). */
  lifeAreaKey?: LifeAreaRef | null;
};

export type VaciarValidationCode =
  | 'empty'
  | 'no_project'
  | 'task_too_long'
  | 'no_subtasks'
  | 'subtask_too_long';

export function validateVaciarTaskDraft(draft: VaciarTaskDraft): VaciarValidationCode | null {
  const trimmed = draft.content.trim();
  if (!trimmed) return 'empty';
  if (draft.assignToProject && !draft.selectedProjectId) return 'no_project';
  if (trimmed.length > MAX_TASK_LENGTH) return 'task_too_long';

  if (draft.hasSubtasks) {
    const validSubtasks = draft.subtasks.filter((st) => st.trim());
    if (validSubtasks.length === 0) return 'no_subtasks';
    for (const subtask of validSubtasks) {
      if (subtask.trim().length > MAX_TASK_LENGTH) return 'subtask_too_long';
    }
  }

  return null;
}
