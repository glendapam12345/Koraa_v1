import { validateVaciarTaskDraft } from '@/lib/vaciarTaskValidation';

describe('validateVaciarTaskDraft', () => {
  const base = {
    content: 'Llamar al banco',
    hasSubtasks: false,
    subtasks: [''],
    assignToProject: false,
    selectedCategory: 'otros',
    selectedProjectId: null,
    selectedDate: null,
  };

  it('returns null for valid draft', () => {
    expect(validateVaciarTaskDraft(base)).toBeNull();
  });

  it('rejects empty content', () => {
    expect(validateVaciarTaskDraft({ ...base, content: '   ' })).toBe('empty');
  });

  it('requires project when assignToProject is true', () => {
    expect(
      validateVaciarTaskDraft({ ...base, assignToProject: true, selectedProjectId: null }),
    ).toBe('no_project');
  });

  it('rejects content over 300 chars', () => {
    expect(validateVaciarTaskDraft({ ...base, content: 'x'.repeat(301) })).toBe('task_too_long');
  });

  it('requires at least one subtask when enabled', () => {
    expect(
      validateVaciarTaskDraft({ ...base, hasSubtasks: true, subtasks: ['  ', ''] }),
    ).toBe('no_subtasks');
  });
});
