import {
  saveCheckInOffline,
  saveTaskOffline,
  getPendingCheckIns,
  getPendingTasks,
  clearOfflineData,
} from '@/lib/offlineStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Mock de Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('offlineStorage', () => {
  beforeEach(async () => {
    // Limpiar AsyncStorage antes de cada test
    await clearOfflineData();
    jest.clearAllMocks();
  });

  describe('saveCheckInOffline', () => {
    it('should save a check-in offline', async () => {
      const checkIn = {
        date: '2025-01-15',
        emotion: 'tranquila',
        energy_level: 4,
        available_time: 'Medio (2-4hrs)',
        focus_level: 'Enfocada',
      };

      await saveCheckInOffline(checkIn);

      const pending = await getPendingCheckIns();
      expect(pending).toHaveLength(1);
      expect(pending[0]).toMatchObject({
        date: checkIn.date,
        emotion: checkIn.emotion,
        energy_level: checkIn.energy_level,
        available_time: checkIn.available_time,
        focus_level: checkIn.focus_level,
      });
      expect(pending[0].id).toMatch(/^offline_\d+_/);
      expect(pending[0].timestamp).toBeGreaterThan(0);
    });

    it('should append multiple check-ins', async () => {
      const checkIn1 = {
        date: '2025-01-15',
        emotion: 'tranquila',
        energy_level: 4,
        available_time: 'Medio (2-4hrs)',
        focus_level: 'Enfocada',
      };

      const checkIn2 = {
        date: '2025-01-16',
        emotion: 'motivada',
        energy_level: 5,
        available_time: 'Bastante (4-6hrs)',
        focus_level: 'Súper enfocada',
      };

      await saveCheckInOffline(checkIn1);
      await saveCheckInOffline(checkIn2);

      const pending = await getPendingCheckIns();
      expect(pending).toHaveLength(2);
      expect(pending[0].emotion).toBe('tranquila');
      expect(pending[1].emotion).toBe('motivada');
    });

    it('should handle errors gracefully', async () => {
      // Mock AsyncStorage para que falle
      jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Storage error'));

      const checkIn = {
        date: '2025-01-15',
        emotion: 'tranquila',
        energy_level: 4,
        available_time: 'Medio (2-4hrs)',
        focus_level: 'Enfocada',
      };

      // No debería lanzar error
      await expect(saveCheckInOffline(checkIn)).resolves.not.toThrow();
    });
  });

  describe('saveTaskOffline', () => {
    it('should save a task offline', async () => {
      const task = {
        content: 'Test task',
        category: 'trabajo',
        is_priority: true,
        is_completed: false,
        parent_task_id: null,
      };

      const taskId = await saveTaskOffline(task);

      const pending = await getPendingTasks();
      expect(pending).toHaveLength(1);
      expect(pending[0]).toMatchObject({
        content: task.content,
        category: task.category,
        is_priority: task.is_priority,
        is_completed: task.is_completed,
        parent_task_id: task.parent_task_id,
      });
      expect(pending[0].id).toBe(taskId);
      expect(pending[0].timestamp).toBeGreaterThan(0);
    });

    it('should use custom ID when provided', async () => {
      const task = {
        content: 'Test task',
        category: 'trabajo',
        is_priority: true,
        is_completed: false,
        parent_task_id: null,
      };

      const customId = 'custom-task-id';
      const taskId = await saveTaskOffline(task, customId);

      expect(taskId).toBe(customId);
      const pending = await getPendingTasks();
      expect(pending[0].id).toBe(customId);
    });

    it('should handle errors and throw', async () => {
      jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Storage error'));

      const task = {
        content: 'Test task',
        category: 'trabajo',
        is_priority: true,
        is_completed: false,
        parent_task_id: null,
      };

      await expect(saveTaskOffline(task)).rejects.toThrow('Storage error');
    });
  });

  describe('getPendingCheckIns', () => {
    it('should return empty array when no check-ins', async () => {
      const pending = await getPendingCheckIns();
      expect(pending).toEqual([]);
    });

    it('should return saved check-ins', async () => {
      const checkIn = {
        date: '2025-01-15',
        emotion: 'tranquila',
        energy_level: 4,
        available_time: 'Medio (2-4hrs)',
        focus_level: 'Enfocada',
      };

      await saveCheckInOffline(checkIn);
      const pending = await getPendingCheckIns();
      expect(pending).toHaveLength(1);
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Storage error'));

      const pending = await getPendingCheckIns();
      expect(pending).toEqual([]);
    });
  });

  describe('getPendingTasks', () => {
    it('should return empty array when no tasks', async () => {
      const pending = await getPendingTasks();
      expect(pending).toEqual([]);
    });

    it('should return saved tasks', async () => {
      const task = {
        content: 'Test task',
        category: 'trabajo',
        is_priority: true,
        is_completed: false,
        parent_task_id: null,
      };

      await saveTaskOffline(task);
      const pending = await getPendingTasks();
      expect(pending).toHaveLength(1);
    });

    it('should handle errors gracefully', async () => {
      // Mock getItem para que falle con un error de parseo
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValueOnce('invalid json{');

      const pending = await getPendingTasks();
      expect(pending).toEqual([]);
    });
  });

  describe('clearOfflineData', () => {
    it('should clear all offline data', async () => {
      // Guardar algunos datos
      await saveCheckInOffline({
        date: '2025-01-15',
        emotion: 'tranquila',
        energy_level: 4,
        available_time: 'Medio (2-4hrs)',
        focus_level: 'Enfocada',
      });

      await saveTaskOffline({
        content: 'Test task',
        category: 'trabajo',
        is_priority: true,
        is_completed: false,
        parent_task_id: null,
      });

      // Verificar que hay datos
      expect(await getPendingCheckIns()).toHaveLength(1);
      expect(await getPendingTasks()).toHaveLength(1);

      // Limpiar
      await clearOfflineData();

      // Verificar que se limpiaron
      expect(await getPendingCheckIns()).toHaveLength(0);
      expect(await getPendingTasks()).toHaveLength(0);
    });
  });

  describe('syncPendingCheckIns', () => {
    it('should return early if no user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
      });

      await saveCheckInOffline({
        date: '2025-01-15',
        emotion: 'tranquila',
        energy_level: 4,
        available_time: 'Medio (2-4hrs)',
        focus_level: 'Enfocada',
      });

      const { syncPendingCheckIns } = require('@/lib/offlineStorage');
      await syncPendingCheckIns();

      // No debería haber llamado a from
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should return early if no pending check-ins', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { syncPendingCheckIns } = require('@/lib/offlineStorage');
      await syncPendingCheckIns();

      // No debería haber llamado a from
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should return early if no network connection', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      await saveCheckInOffline({
        date: '2025-01-15',
        emotion: 'tranquila',
        energy_level: 4,
        available_time: 'Medio (2-4hrs)',
        focus_level: 'Enfocada',
      });

      // Mock checkNetworkConnection to return false
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Network error' },
              }),
            }),
          }),
        }),
      });

      const { syncPendingCheckIns } = require('@/lib/offlineStorage');
      await syncPendingCheckIns();

      // No debería haber llamado a daily_check_ins
      expect(supabase.from).not.toHaveBeenCalledWith('daily_check_ins');
    });

    it('should sync check-ins successfully', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      await saveCheckInOffline({
        date: '2025-01-15',
        emotion: 'tranquila',
        energy_level: 4,
        available_time: 'Medio (2-4hrs)',
        focus_level: 'Enfocada',
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'user-123' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'daily_check_ins') {
          return {
            upsert: jest.fn().mockResolvedValue({
              error: null,
            }),
          };
        }
        return {};
      });

      const { syncPendingCheckIns } = require('@/lib/offlineStorage');
      await syncPendingCheckIns();

      expect(supabase.from).toHaveBeenCalledWith('daily_check_ins');
      
      // Verificar que se removieron los check-ins sincronizados
      const remaining = await getPendingCheckIns();
      expect(remaining.length).toBe(0);
    });

    it('should handle sync errors gracefully', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      await saveCheckInOffline({
        date: '2025-01-15',
        emotion: 'tranquila',
        energy_level: 4,
        available_time: 'Medio (2-4hrs)',
        focus_level: 'Enfocada',
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'user-123' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'daily_check_ins') {
          return {
            upsert: jest.fn().mockResolvedValue({
              error: { message: 'Sync error' },
            }),
          };
        }
        return {};
      });

      const { syncPendingCheckIns } = require('@/lib/offlineStorage');
      await syncPendingCheckIns();

      // El check-in debería seguir pendiente porque falló la sincronización
      const remaining = await getPendingCheckIns();
      expect(remaining.length).toBe(1);
    });
  });

  describe('syncPendingTasks', () => {
    it('should return early if no user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
      });

      await saveTaskOffline({
        content: 'Test task',
        category: 'trabajo',
        is_priority: true,
        is_completed: false,
        parent_task_id: null,
      });

      const { syncPendingTasks } = require('@/lib/offlineStorage');
      await syncPendingTasks();

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should return early if no pending tasks', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { syncPendingTasks } = require('@/lib/offlineStorage');
      await syncPendingTasks();

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should sync main tasks and subtasks', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      // Guardar tarea principal
      const mainTaskId = await saveTaskOffline({
        content: 'Main task',
        category: 'trabajo',
        is_priority: true,
        is_completed: false,
        parent_task_id: null,
      });

      // Guardar subtarea
      await saveTaskOffline({
        content: 'Subtask',
        category: 'trabajo',
        is_priority: true,
        is_completed: false,
        parent_task_id: mainTaskId,
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'user-123' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'tasks') {
          const mockInsert = {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'real-task-id' },
                  error: null,
                }),
              }),
            }),
          };
          return mockInsert;
        }
        return {};
      });

      const { syncPendingTasks } = require('@/lib/offlineStorage');
      await syncPendingTasks();

      expect(supabase.from).toHaveBeenCalledWith('tasks');
    });

    it('should handle subtask without parent task ID', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      // Guardar subtarea sin parent válido
      await saveTaskOffline({
        content: 'Orphan subtask',
        category: 'trabajo',
        is_priority: true,
        is_completed: false,
        parent_task_id: 'offline_invalid_parent',
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'user-123' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'tasks') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const { syncPendingTasks } = require('@/lib/offlineStorage');
      await syncPendingTasks();

      // La subtarea debería seguir pendiente
      const remaining = await getPendingTasks();
      expect(remaining.length).toBeGreaterThan(0);
    });

    it('should handle syncPendingTasks without network connection', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      await saveTaskOffline({
        content: 'Test task',
        category: 'trabajo',
        is_priority: true,
        is_completed: false,
        parent_task_id: null,
      });

      // Mock checkNetworkConnection to return false
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Network error' },
              }),
            }),
          }),
        }),
      });

      const { syncPendingTasks } = require('@/lib/offlineStorage');
      await syncPendingTasks();

      // No debería haber llamado a tasks
      expect(supabase.from).not.toHaveBeenCalledWith('tasks');
    });

    it('should handle syncPendingTasks with error in main task sync', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      await saveTaskOffline({
        content: 'Test task',
        category: 'trabajo',
        is_priority: true,
        is_completed: false,
        parent_task_id: null,
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'user-123' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'tasks') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' },
                }),
              }),
            }),
          };
        }
        return {};
      });

      const { syncPendingTasks } = require('@/lib/offlineStorage');
      await syncPendingTasks();

      // La tarea debería seguir pendiente
      const remaining = await getPendingTasks();
      expect(remaining.length).toBe(1);
    });

    it('should handle syncPendingTasks with error in subtask sync', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      // Guardar tarea principal
      const mainTaskId = await saveTaskOffline({
        content: 'Main task',
        category: 'trabajo',
        is_priority: true,
        is_completed: false,
        parent_task_id: null,
      });

      // Guardar subtarea
      await saveTaskOffline({
        content: 'Subtask',
        category: 'trabajo',
        is_priority: true,
        is_completed: false,
        parent_task_id: mainTaskId,
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'user-123' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'tasks') {
          if (callCount === 2) {
            // Primera llamada: main task exitosa
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'real-task-id' },
                    error: null,
                  }),
                }),
              }),
            };
          } else {
            // Segunda llamada: subtask con error
            return {
              insert: jest.fn().mockResolvedValue({
                error: { message: 'Subtask error' },
              }),
            };
          }
        }
        return {};
      });

      const { syncPendingTasks } = require('@/lib/offlineStorage');
      await syncPendingTasks();

      // La subtarea debería seguir pendiente
      const remaining = await getPendingTasks();
      expect(remaining.length).toBeGreaterThan(0);
    });

    it('should handle checkNetworkConnection with fetch error', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'fetch failed' },
              }),
            }),
          }),
        }),
      });

      const { checkNetworkConnection } = require('@/lib/offlineStorage');
      const result = await checkNetworkConnection();

      expect(result).toBe(false);
    });

    it('should handle checkNetworkConnection with connection error', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'connection timeout' },
              }),
            }),
          }),
        }),
      });

      const { checkNetworkConnection } = require('@/lib/offlineStorage');
      const result = await checkNetworkConnection();

      expect(result).toBe(false);
    });

    it('should handle checkNetworkConnection exception', async () => {
      (supabase.auth.getUser as jest.Mock).mockRejectedValue(new Error('Auth error'));

      const { checkNetworkConnection } = require('@/lib/offlineStorage');
      const result = await checkNetworkConnection();

      expect(result).toBe(false);
    });
  });

  describe('syncAll', () => {
    it('should sync all pending data', async () => {
      // Guardar datos primero
      await saveCheckInOffline({
        date: '2025-01-15',
        emotion: 'tranquila',
        energy_level: 4,
        available_time: 'Medio (2-4hrs)',
        focus_level: 'Enfocada',
      });

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      // Mock para checkNetworkConnection (profiles)
      // Mock para syncPendingCheckIns (daily_check_ins)
      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'user-123' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'daily_check_ins') {
          return {
            upsert: jest.fn().mockResolvedValue({
              error: null,
            }),
          };
        }
        return {};
      });

      const { syncAll } = require('@/lib/offlineStorage');
      await syncAll();

      // Debería haber intentado verificar conexión y sincronizar
      expect(supabase.from).toHaveBeenCalled();
    });
  });

  describe('checkNetworkConnection', () => {
    it('should return false if no user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
      });

      const { checkNetworkConnection } = require('@/lib/offlineStorage');
      const result = await checkNetworkConnection();

      expect(result).toBe(false);
    });

    it('should return true if connection is available', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 'user-123' },
                error: null,
              }),
            }),
          }),
        }),
      });

      const { checkNetworkConnection } = require('@/lib/offlineStorage');
      const result = await checkNetworkConnection();

      expect(result).toBe(true);
    });

    it('should return false on network error', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Network error' },
              }),
            }),
          }),
        }),
      });

      const { checkNetworkConnection } = require('@/lib/offlineStorage');
      const result = await checkNetworkConnection();

      expect(result).toBe(false);
    });
  });
});
