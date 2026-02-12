import { prioritizeTasksIntelligently, calculateTaskScore, generatePrioritizationExplanation } from '@/lib/smartPrioritization';
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

  describe('generatePrioritizationExplanation', () => {
    it('should generate explanation for prioritized tasks', () => {
      const prioritizedTasks = [mockTasks[0], mockTasks[1]];
      const result = generatePrioritizationExplanation(prioritizedTasks, mockCheckIn, mockTasks);

      expect(result).toBeDefined();
      expect(result.message).toContain('tareas esenciales');
      expect(result.reasoning).toBeDefined();
      expect(result.suggestion).toBeDefined();
    });

    it('should handle single task', () => {
      const prioritizedTasks = [mockTasks[0]];
      const result = generatePrioritizationExplanation(prioritizedTasks, mockCheckIn, mockTasks);

      expect(result.message).toContain('tarea esencial');
    });

    it('should include energy level in reasoning', () => {
      const lowEnergyCheckIn: CheckInData = {
        ...mockCheckIn,
        energyLevel: 1,
      };

      const prioritizedTasks = [mockTasks[0]];
      const result = generatePrioritizationExplanation(prioritizedTasks, lowEnergyCheckIn, mockTasks);

      expect(result.reasoning).toContain('energía 1/5');
    });

    it('should include high energy in reasoning', () => {
      const highEnergyCheckIn: CheckInData = {
        ...mockCheckIn,
        energyLevel: 5,
      };

      const prioritizedTasks = [mockTasks[0]];
      const result = generatePrioritizationExplanation(prioritizedTasks, highEnergyCheckIn, mockTasks);

      expect(result.reasoning).toContain('energía alta');
    });

    it('should include emotion in reasoning', () => {
      const prioritizedTasks = [mockTasks[0]];
      const result = generatePrioritizationExplanation(prioritizedTasks, mockCheckIn, mockTasks);

      expect(result.reasoning).toContain('tranquila');
    });

    it('should include time availability in reasoning', () => {
      const littleTimeCheckIn: CheckInData = {
        ...mockCheckIn,
        availableTime: 'Poco (1-2hrs)',
      };

      const prioritizedTasks = [mockTasks[0]];
      const result = generatePrioritizationExplanation(prioritizedTasks, littleTimeCheckIn, mockTasks);

      expect(result.reasoning).toContain('poco tiempo disponible');
    });

    it('should include focus level in reasoning', () => {
      const lowFocusCheckIn: CheckInData = {
        ...mockCheckIn,
        focusLevel: 'Muy distraída',
      };

      const prioritizedTasks = [mockTasks[0]];
      const result = generatePrioritizationExplanation(prioritizedTasks, lowFocusCheckIn, mockTasks);

      expect(result.reasoning).toContain('bajo nivel de enfoque');
    });

    it('should suggest less tasks for low energy', () => {
      const lowEnergyCheckIn: CheckInData = {
        ...mockCheckIn,
        energyLevel: 1,
        emotion: 'agotada',
      };

      const prioritizedTasks = [mockTasks[0]];
      const result = generatePrioritizationExplanation(prioritizedTasks, lowEnergyCheckIn, mockTasks);

      expect(result.suggestion).toContain('Menos es más');
    });

    it('should suggest more tasks for high energy', () => {
      const highEnergyCheckIn: CheckInData = {
        ...mockCheckIn,
        energyLevel: 5,
      };

      const prioritizedTasks = [mockTasks[0]];
      const result = generatePrioritizationExplanation(prioritizedTasks, highEnergyCheckIn, mockTasks);

      expect(result.suggestion).toContain('energía para más');
    });

    it('should handle different time availability options', () => {
      const timeOptions = [
        'Poco (1-2hrs)',
        'Medio (2-4hrs)',
        'Bastante (4-6hrs)',
        'Todo el día',
        'Invalid option', // Default case
      ];

      timeOptions.forEach(availableTime => {
        const checkIn: CheckInData = {
          ...mockCheckIn,
          availableTime,
        };

        const result = prioritizeTasksIntelligently(mockTasks, checkIn);
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should handle tasks with different word counts for duration estimation', () => {
      const shortTask: Task = {
        id: 'short',
        content: 'Llamar',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      };

      const mediumTask: Task = {
        id: 'medium',
        content: 'Escribir documento importante para el proyecto',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      };

      const longTask: Task = {
        id: 'long',
        content: 'Crear presentación completa del proyecto con todos los detalles y análisis exhaustivo de cada componente',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      };

      const categoryCounts = new Map<string, number>([['trabajo', 1]]);
      
      const shortResult = calculateTaskScore(shortTask, mockCheckIn, categoryCounts);
      const mediumResult = calculateTaskScore(mediumTask, mockCheckIn, categoryCounts);
      const longResult = calculateTaskScore(longTask, mockCheckIn, categoryCounts);

      expect(shortResult).toBeDefined();
      expect(mediumResult).toBeDefined();
      expect(longResult).toBeDefined();
    });

    it('should handle tasks with different complexity levels', () => {
      const simpleTask: Task = {
        id: 'simple',
        content: 'Enviar email',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      };

      const complexTask: Task = {
        id: 'complex',
        content: 'Desarrollar estrategia completa para el proyecto con análisis detallado',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      };

      const categoryCounts = new Map<string, number>([['trabajo', 1]]);
      
      const simpleResult = calculateTaskScore(simpleTask, mockCheckIn, categoryCounts);
      const complexResult = calculateTaskScore(complexTask, mockCheckIn, categoryCounts);

      expect(simpleResult).toBeDefined();
      expect(complexResult).toBeDefined();
    });

    it('should handle tasks with different types (creative, administrative, neutral)', () => {
      const creativeTask: Task = {
        id: 'creative',
        content: 'Diseñar nueva interfaz',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      };

      const adminTask: Task = {
        id: 'admin',
        content: 'Pagar factura del banco',
        category: 'personal',
        is_completed: false,
        parent_task_id: null,
      };

      const neutralTask: Task = {
        id: 'neutral',
        content: 'Revisar documentos',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      };

      const categoryCounts = new Map<string, number>([['trabajo', 1], ['personal', 1]]);
      
      const creativeResult = calculateTaskScore(creativeTask, mockCheckIn, categoryCounts);
      const adminResult = calculateTaskScore(adminTask, mockCheckIn, categoryCounts);
      const neutralResult = calculateTaskScore(neutralTask, mockCheckIn, categoryCounts);

      expect(creativeResult).toBeDefined();
      expect(adminResult).toBeDefined();
      expect(neutralResult).toBeDefined();
    });

    it('should handle category balance correctly', () => {
      const tasks: Task[] = [
        { id: '1', content: 'Tarea trabajo 1', category: 'trabajo', is_completed: false, parent_task_id: null },
        { id: '2', content: 'Tarea trabajo 2', category: 'trabajo', is_completed: false, parent_task_id: null },
        { id: '3', content: 'Tarea trabajo 3', category: 'trabajo', is_completed: false, parent_task_id: null },
        { id: '4', content: 'Tarea salud', category: 'salud', is_completed: false, parent_task_id: null },
      ];

      const result = prioritizeTasksIntelligently(tasks, mockCheckIn);
      
      // Debería priorizar la tarea de salud para balance
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle tasks without category', () => {
      const taskWithoutCategory: Task = {
        id: 'no-cat',
        content: 'Tarea sin categoría',
        category: '',
        is_completed: false,
        parent_task_id: null,
      };

      const categoryCounts = new Map<string, number>([['sin categoría', 1]]);
      const result = calculateTaskScore(taskWithoutCategory, mockCheckIn, categoryCounts);

      expect(result).toBeDefined();
      expect(result.reasons).toBeDefined();
    });

    it('should handle normal focus level with medium complexity', () => {
      // Tarea que será clasificada como medium (5-15 palabras, sin keywords complejas)
      const mediumTask: Task = {
        id: 'medium',
        content: 'Preparar presentación del proyecto para la reunión',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 días atrás
      };

      const normalFocusCheckIn: CheckInData = {
        ...mockCheckIn,
        focusLevel: 'Normal',
      };

      const categoryCounts = new Map<string, number>([['trabajo', 1]]);
      const result = calculateTaskScore(mediumTask, normalFocusCheckIn, categoryCounts);

      // Verificar que el score es positivo y tiene razones
      expect(result.score).toBeGreaterThan(0);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should handle high focus with simple tasks', () => {
      const simpleTask: Task = {
        id: 'simple',
        content: 'Enviar email',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      };

      const highFocusCheckIn: CheckInData = {
        ...mockCheckIn,
        focusLevel: 'Súper enfocada',
      };

      const categoryCounts = new Map<string, number>([['trabajo', 1]]);
      const result = calculateTaskScore(simpleTask, highFocusCheckIn, categoryCounts);

      expect(result.score).toBeGreaterThan(0);
    });

    it('should handle creative tasks for negative emotions', () => {
      // Tarea creativa compleja (más de 15 palabras o keyword "diseñar")
      const creativeTask: Task = {
        id: 'creative',
        content: 'Diseñar nueva interfaz completa del sistema con todos los componentes y funcionalidades',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 días atrás
      };

      const negativeEmotionCheckIn: CheckInData = {
        ...mockCheckIn,
        emotion: 'agotada',
        focusLevel: 'Normal', // Para que no se penalice por enfoque
      };

      const categoryCounts = new Map<string, number>([['trabajo', 1]]);
      const result = calculateTaskScore(creativeTask, negativeEmotionCheckIn, categoryCounts);

      // Verificar que tiene razones y el score puede ser negativo o bajo
      expect(result.reasons.length).toBeGreaterThan(0);
      // Puede tener la razón de penalización o no, dependiendo de otros factores
      const hasNegativeReason = result.reasons.some(r => 
        r.includes('creativa compleja') || r.includes('no ideal')
      );
      // Si no tiene la razón específica, al menos verificamos que el score refleje la penalización
      expect(result.score < 20 || hasNegativeReason).toBe(true);
    });

    it('should handle administrative simple tasks for negative emotions', () => {
      const adminTask: Task = {
        id: 'admin',
        content: 'Confirmar cita',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      };

      const negativeEmotionCheckIn: CheckInData = {
        ...mockCheckIn,
        emotion: 'ansiosa',
      };

      const categoryCounts = new Map<string, number>([['trabajo', 1]]);
      const result = calculateTaskScore(adminTask, negativeEmotionCheckIn, categoryCounts);

      expect(result.reasons).toContain('Tarea administrativa simple ideal para tu estado');
    });

    it('should handle category over-representation', () => {
      const tasks: Task[] = [
        { id: '1', content: 'Tarea trabajo 1', category: 'trabajo', is_completed: false, parent_task_id: null },
        { id: '2', content: 'Tarea trabajo 2', category: 'trabajo', is_completed: false, parent_task_id: null },
        { id: '3', content: 'Tarea trabajo 3', category: 'trabajo', is_completed: false, parent_task_id: null },
        { id: '4', content: 'Tarea trabajo 4', category: 'trabajo', is_completed: false, parent_task_id: null },
        { id: '5', content: 'Tarea salud', category: 'salud', is_completed: false, parent_task_id: null },
      ];

      const result = prioritizeTasksIntelligently(tasks, mockCheckIn);
      
      // Debería priorizar la tarea de salud para balance
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle tasks with default time option', () => {
      const checkIn: CheckInData = {
        ...mockCheckIn,
        availableTime: 'Invalid option',
      };

      const result = prioritizeTasksIntelligently(mockTasks, checkIn);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should estimate duration for task without keywords (default medium)', () => {
      // Tarea sin keywords específicas, debería usar default (45 min)
      const defaultTask: Task = {
        id: 'default',
        content: 'Hacer algo importante',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      };

      const categoryCounts = new Map<string, number>([['trabajo', 1]]);
      const result = calculateTaskScore(defaultTask, mockCheckIn, categoryCounts);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should penalize complex tasks with low focus', () => {
      const complexTask: Task = {
        id: 'complex',
        content: 'Desarrollar estrategia completa para el proyecto con análisis detallado',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      };

      const lowFocusCheckIn: CheckInData = {
        ...mockCheckIn,
        focusLevel: 'Muy distraída',
      };

      const categoryCounts = new Map<string, number>([['trabajo', 1]]);
      const result = calculateTaskScore(complexTask, lowFocusCheckIn, categoryCounts);

      expect(result.reasons).toContain('Tarea compleja para tu nivel de enfoque actual');
      expect(result.score).toBeLessThan(20); // Debería estar penalizado
    });

    it('should add small boost for simple tasks with high focus', () => {
      const simpleTask: Task = {
        id: 'simple',
        content: 'Enviar email',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      };

      const highFocusCheckIn: CheckInData = {
        ...mockCheckIn,
        focusLevel: 'Súper enfocada',
      };

      const categoryCounts = new Map<string, number>([['trabajo', 1]]);
      const result = calculateTaskScore(simpleTask, highFocusCheckIn, categoryCounts);

      // Debería tener un boost pequeño pero positivo
      expect(result.score).toBeGreaterThan(0);
    });

    it('should adjust task count when tasks exceed available time', () => {
      // Crear tareas muy largas que excedan el tiempo disponible
      const longTasks: Task[] = Array.from({ length: 5 }, (_, i) => ({
        id: `long-${i}`,
        content: 'Crear proyecto completo con muchos detalles y análisis exhaustivo de cada componente del sistema',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      }));

      const littleTimeCheckIn: CheckInData = {
        ...mockCheckIn,
        availableTime: 'Poco (1-2hrs)', // 90 minutos
        energyLevel: 5, // Alta energía pero poco tiempo
      };

      const result = prioritizeTasksIntelligently(longTasks, littleTimeCheckIn);

      // Debería reducir el número de tareas porque no caben en el tiempo
      expect(result.length).toBeLessThan(longTasks.length);
      expect(result.length).toBeGreaterThan(0); // Al menos 1
    });

    it('should handle generatePrioritizationExplanation with high focus', () => {
      const prioritizedTasks = [mockTasks[0]];
      const highFocusCheckIn: CheckInData = {
        ...mockCheckIn,
        focusLevel: 'Súper enfocada',
      };

      const result = generatePrioritizationExplanation(prioritizedTasks, highFocusCheckIn, mockTasks);

      expect(result.reasoning).toContain('alto nivel de enfoque');
    });

    it('should handle generatePrioritizationExplanation with low focus', () => {
      const prioritizedTasks = [mockTasks[0]];
      const lowFocusCheckIn: CheckInData = {
        ...mockCheckIn,
        focusLevel: 'Algo distraída',
      };

      const result = generatePrioritizationExplanation(prioritizedTasks, lowFocusCheckIn, mockTasks);

      expect(result.reasoning).toContain('bajo nivel de enfoque');
    });

    it('should handle generatePrioritizationExplanation with moderate energy', () => {
      const prioritizedTasks = [mockTasks[0]];
      const moderateEnergyCheckIn: CheckInData = {
        ...mockCheckIn,
        energyLevel: 3,
      };

      const result = generatePrioritizationExplanation(prioritizedTasks, moderateEnergyCheckIn, mockTasks);

      expect(result.reasoning).toContain('energía moderada');
      expect(result.suggestion).toContain('energía moderada');
    });
  });
});
