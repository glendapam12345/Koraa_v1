const storage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(storage.get(key) ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    storage.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    storage.delete(key);
    return Promise.resolve();
  }),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

import {
  getPendingCheckIns,
  getPendingTasks,
  saveCheckInOffline,
  saveTaskOffline,
} from '@/lib/offlineStorage';

describe('offlineStorage', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('queues a check-in offline', async () => {
    await saveCheckInOffline({
      date: '2026-05-19',
      emotion: 'tranquila',
      energy_level: 3,
      available_time: 'Medio (2-4hrs)',
      focus_level: 'Normal',
    });
    const pending = await getPendingCheckIns();
    expect(pending).toHaveLength(1);
    expect(pending[0].date).toBe('2026-05-19');
    expect(pending[0].emotion).toBe('tranquila');
  });

  it('queues a task offline and returns stable id', async () => {
    const id = await saveTaskOffline(
      {
        content: 'Comprar leche',
        category: 'hogar',
        is_priority: false,
        is_completed: false,
        parent_task_id: null,
        project_id: null,
      },
      'offline_test_1',
    );
    expect(id).toBe('offline_test_1');
    const pending = await getPendingTasks();
    expect(pending).toHaveLength(1);
    expect(pending[0].content).toBe('Comprar leche');
  });
});
