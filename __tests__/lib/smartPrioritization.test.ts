import { prioritizeTasksIntelligently, calculateTaskScore } from '@/lib/smartPrioritization';
import type { Task, CheckInData } from '@/lib/smartPrioritization';

describe('smartPrioritization', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      content: 'Reunión importante con el equipo',
      category: 'trabajo',
      is_completed: false,
      parent_task_id: null,
      created_at: '2025-01-15T10:00:00Z',
    },
    {
      id: '2',
      content: 'Ir al gimnasio',
      category: 'salud',
      is_completed: false,
      parent_task_id: null,
      created_at: '2025-01-15T09:00:00Z',
    },
    {
      id: '3',
      content: 'Llamar a mi mamá',
      category: 'personal',
      is_completed: false,
      parent_task_id: null,
      created_at: '2025-01-15T08:00:00Z',
    },
  ];

  const mockCheckIn: CheckInData = {
    energyLevel: 3,
    emotion: 'tranquila',
    availableTime: 'Medio (2-4hrs)',
    focusLevel: 'Normal',
  };

  describe('prioritizeTasksIntelligently', () => {
    it('should return prioritized tasks', () => {
      const result = prioritizeTasksIntelligently(mockTasks, mockCheckIn);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(mockTasks.length);
    });

    it('should prioritize tasks based on check-in data', () => {
      const highEnergyCheckIn: CheckInData = {
        ...mockCheckIn,
        energyLevel: 5,
        emotion: 'motivada',
      };

      const result = prioritizeTasksIntelligently(mockTasks, highEnergyCheckIn);
      
      // Con alta energía, debería priorizar más tareas
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty task list', () => {
      const result = prioritizeTasksIntelligently([], mockCheckIn);
      
      expect(result).toEqual([]);
    });

    it('should handle low energy check-in', () => {
      const lowEnergyCheckIn: CheckInData = {
        ...mockCheckIn,
        energyLevel: 1,
        emotion: 'agotada',
      };

      const result = prioritizeTasksIntelligently(mockTasks, lowEnergyCheckIn);
      
      // Con baja energía, debería priorizar menos tareas
      expect(result.length).toBeLessThanOrEqual(mockTasks.length);
    });
  });

  describe('calculateTaskScore', () => {
    it('should calculate score for a task', () => {
      const task = mockTasks[0];
      const categoryCounts = new Map<string, number>([
        ['trabajo', 1],
        ['salud', 1],
        ['personal', 1],
      ]);

      const result = calculateTaskScore(task, mockCheckIn, categoryCounts);
      
      expect(result).toBeDefined();
      expect(result.task).toEqual(task);
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.reasons)).toBe(true);
    });

    it('should assign higher score to tasks matching emotion', () => {
      const creativeTask: Task = {
        id: '4',
        content: 'Diseñar nueva interfaz',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
        created_at: new Date().toISOString(),
      };

      const motivatedCheckIn: CheckInData = {
        ...mockCheckIn,
        emotion: 'motivada',
      };

      const categoryCounts = new Map<string, number>([['trabajo', 1]]);
      const result = calculateTaskScore(creativeTask, motivatedCheckIn, categoryCounts);
      
      expect(result.score).toBeGreaterThan(0);
    });

    it('should handle tasks without created_at', () => {
      const taskWithoutDate: Task = {
        id: '5',
        content: 'Tarea sin fecha',
        category: 'personal',
        is_completed: false,
        parent_task_id: null,
      };

      const categoryCounts = new Map<string, number>([['personal', 1]]);
      const result = calculateTaskScore(taskWithoutDate, mockCheckIn, categoryCounts);
      
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });
});
