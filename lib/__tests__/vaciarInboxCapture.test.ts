import {
  applyAdvancedCaptureOptions,
  buildInboxReleaseItems,
  parseCaptureToInboxItems,
} from '@/lib/vaciarInboxCapture';

describe('vaciarInboxCapture', () => {
  it('parses list into inbox items without category', () => {
    const items = parseCaptureToInboxItems(
      'llamar al dentista, comprar leche, correr',
      'es',
    );
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items.every((item) => item.selectedCategory === '')).toBe(true);
    expect(items.every((item) => !item.assignToProject)).toBe(true);
    expect(items.every((item) => item.effortFeel == null)).toBe(true);
  });

  it('applies advanced project to all inbox items', () => {
    const items = parseCaptureToInboxItems('tarea a, tarea b', 'es');
    const withProject = applyAdvancedCaptureOptions(items, {
      assignToProject: true,
      selectedProjectId: 'proj-123',
      selectedCategory: 'otros',
      selectedDate: null,
      effortFeel: null,
    });
    expect(withProject.every((item) => item.selectedProjectId === 'proj-123')).toBe(true);
  });

  it('builds inbox items by default without advanced options', () => {
    const items = buildInboxReleaseItems('solo una cosa', 'es');
    expect(items).toHaveLength(1);
    expect(items[0].selectedCategory).toBe('');
  });
});
