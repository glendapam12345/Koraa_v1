import { organizeBatchFromInput } from '@/lib/vaciarBatchOrganize';

jest.mock('@/lib/taskCaptureAi', () => ({
  interpretTaskCapture: jest.fn(async (userId: string | undefined, input: { rawText: string }) => ({
    summary: input.rawText,
    fromAi: false,
    main_task: { content: 'a', scheduled_date: null },
    prep_steps: [{ content: 'b', scheduled_date: null }],
  })),
}));

jest.mock('@/lib/projectDueDateSchema', () => ({
  fetchUserProjects: jest.fn(async () => ({ data: [], supportsDueDate: true, error: null })),
}));

describe('vaciarBatchOrganize', () => {
  it('returns empty for single task input', async () => {
    const items = await organizeBatchFromInput('solo una', 'es', 'user-1');
    expect(items).toEqual([]);
  });

  it('splits comma-separated list into batch items', async () => {
    const items = await organizeBatchFromInput(
      'llamar al dentista, comprar leche, correr',
      'es',
      'user-1',
    );
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items.every((item) => item.content.trim())).toBe(true);
  });
});
