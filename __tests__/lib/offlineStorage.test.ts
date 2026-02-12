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
});
