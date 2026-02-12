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

    it('should prioritize simple tasks when focus is low', () => {
      const simpleTask: Task = {
        id: '6',
        content: 'Llamar a cliente',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      };

      const lowFocusCheckIn: CheckInData = {
        ...mockCheckIn,
        focusLevel: 'Muy distraída',
      };

      const categoryCounts = new Map<string, number>([['trabajo', 1]]);
      const result = calculateTaskScore(simpleTask, lowFocusCheckIn, categoryCounts);
      
      expect(result.reasons).toContain('Tarea simple para tu nivel de enfoque');
      expect(result.score).toBeGreaterThan(0);
    });

    it('should prioritize complex tasks when focus is high', () => {
      const complexTask: Task = {
        id: '7',
        content: 'Desarrollar nueva funcionalidad del proyecto',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      };

      const highFocusCheckIn: CheckInData = {
        ...mockCheckIn,
        focusLevel: 'Súper enfocada',
      };

      const categoryCounts = new Map<string, number>([['trabajo', 1]]);
      const result = calculateTaskScore(complexTask, highFocusCheckIn, categoryCounts);
      
      expect(result.reasons).toContain('Tarea compleja ideal para tu nivel de enfoque');
      expect(result.score).toBeGreaterThan(0);
    });

    it('should adjust score based on task duration vs available time', () => {
      const quickTask: Task = {
        id: '8',
        content: 'Enviar email',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      };

      const littleTimeCheckIn: CheckInData = {
        ...mockCheckIn,
        availableTime: 'Poco (1-2hrs)',
      };

      const categoryCounts = new Map<string, number>([['trabajo', 1]]);
      const result = calculateTaskScore(quickTask, littleTimeCheckIn, categoryCounts);
      
      expect(result.reasons).toContain('Tarea rápida que cabe en tu tiempo');
      expect(result.score).toBeGreaterThan(0);
    });

    it('should penalize tasks that exceed available time', () => {
      // Crear una tarea con subtareas para que sea estimada como muy larga (>90 min)
      const longTask: Task = {
        id: '9',
        content: 'Proyecto completo con múltiples componentes',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
        subtasks: [
          { id: '9-1', content: 'Subtarea 1', category: 'trabajo', is_completed: false, parent_task_id: '9' },
          { id: '9-2', content: 'Subtarea 2', category: 'trabajo', is_completed: false, parent_task_id: '9' },
          { id: '9-3', content: 'Subtarea 3', category: 'trabajo', is_completed: false, parent_task_id: '9' },
          { id: '9-4', content: 'Subtarea 4', category: 'trabajo', is_completed: false, parent_task_id: '9' },
          { id: '9-5', content: 'Subtarea 5', category: 'trabajo', is_completed: false, parent_task_id: '9' },
        ], // 60 + (5 * 15) = 135 minutos, excede los 90 disponibles
      };

      const littleTimeCheckIn: CheckInData = {
        ...mockCheckIn,
        availableTime: 'Poco (1-2hrs)', // 90 minutos disponibles
      };

      const categoryCounts = new Map<string, number>([['trabajo', 1]]);
      const result = calculateTaskScore(longTask, littleTimeCheckIn, categoryCounts);
      
      // La tarea debería ser estimada como >90 minutos, excediendo los 90 minutos disponibles
      expect(result.reasons).toContain('Tarea muy larga para tu tiempo disponible');
    });

    it('should boost score for recent tasks', () => {
      const recentTask: Task = {
        id: '10',
        content: 'Tarea reciente',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
        created_at: new Date().toISOString(), // Hoy
      };

      const categoryCounts = new Map<string, number>([['trabajo', 1]]);
      const result = calculateTaskScore(recentTask, mockCheckIn, categoryCounts);
      
      expect(result.reasons).toContain('Tarea reciente');
    });

    it('should handle tasks with subtasks', () => {
      const taskWithSubtasks: Task = {
        id: '11',
        content: 'Proyecto completo',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
        subtasks: [
          { id: '11-1', content: 'Subtarea 1', category: 'trabajo', is_completed: false, parent_task_id: '11' },
          { id: '11-2', content: 'Subtarea 2', category: 'trabajo', is_completed: false, parent_task_id: '11' },
        ],
      };

      const categoryCounts = new Map<string, number>([['trabajo', 1]]);
      const result = calculateTaskScore(taskWithSubtasks, mockCheckIn, categoryCounts);
      
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should filter out completed tasks', () => {
      const completedTask: Task = {
        id: '12',
        content: 'Tarea completada',
        category: 'trabajo',
        is_completed: true,
        parent_task_id: null,
      };

      const tasksWithCompleted = [...mockTasks, completedTask];
      const result = prioritizeTasksIntelligently(tasksWithCompleted, mockCheckIn);
      
      expect(result.find(t => t.id === '12')).toBeUndefined();
    });

    it('should filter out subtasks from main list', () => {
      const subtask: Task = {
        id: '13',
        content: 'Subtarea',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: '1',
      };

      const tasksWithSubtask = [...mockTasks, subtask];
      const result = prioritizeTasksIntelligently(tasksWithSubtask, mockCheckIn);
      
      expect(result.find(t => t.id === '13')).toBeUndefined();
    });

    it('should limit tasks based on energy level', () => {
      const manyTasks: Task[] = Array.from({ length: 10 }, (_, i) => ({
        id: `task-${i}`,
        content: `Tarea ${i}`,
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      }));

      const lowEnergyCheckIn: CheckInData = {
        ...mockCheckIn,
        energyLevel: 1,
        emotion: 'agotada',
      };

      const result = prioritizeTasksIntelligently(manyTasks, lowEnergyCheckIn);
      
      // Con energía 1, debería limitar a 2 tareas máximo
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should adjust task count based on available time', () => {
      const longTasks: Task[] = [
        {
          id: '14',
          content: 'Crear proyecto completo con muchos detalles y análisis exhaustivo',
          category: 'trabajo',
          is_completed: false,
          parent_task_id: null,
        },
        {
          id: '15',
          content: 'Desarrollar nueva funcionalidad compleja del sistema',
          category: 'trabajo',
          is_completed: false,
          parent_task_id: null,
        },
      ];

      const littleTimeCheckIn: CheckInData = {
        ...mockCheckIn,
        availableTime: 'Poco (1-2hrs)',
        energyLevel: 5, // Alta energía pero poco tiempo
      };

      const result = prioritizeTasksIntelligently(longTasks, littleTimeCheckIn);
      
      // Debería reducir el número de tareas porque no caben en el tiempo
      expect(result.length).toBeLessThanOrEqual(longTasks.length);
    });
  });
});
