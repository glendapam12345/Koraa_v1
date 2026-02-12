import { renderHook, waitFor } from '@testing-library/react-native';
import { useTasks } from '@/hooks/useTasks';
import { supabase } from '@/lib/supabase';
import type { Task } from '@/components/tasks/TaskCard';

// Mock de Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
  getErrorMessage: jest.fn((error) => error?.message || 'Error desconocido'),
}));

describe('useTasks', () => {
  const mockShowToast = jest.fn();
  const mockTodayMood = 'tranquila';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty tasks', () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    const { result } = renderHook(() => useTasks(mockTodayMood, mockShowToast));

    expect(result.current.tasks).toEqual([]);
    expect(result.current.loadingTasks).toBe(false);
  });

  it('should load tasks successfully', async () => {
    const mockUser = { id: 'user-123' };
    const mockTasks: Task[] = [
      {
        id: '1',
        content: 'Tarea 1',
        category: 'trabajo',
        is_completed: false,
        parent_task_id: null,
      },
      {
        id: '2',
        content: 'Tarea 2',
        category: 'salud',
        is_completed: false,
        parent_task_id: null,
      },
    ];

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    });

    // Mock check-in exists
    (supabase.from as jest.Mock)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 'check-in-123' },
                error: null,
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockTasks,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

    const { result } = renderHook(() => useTasks(mockTodayMood, mockShowToast));

    result.current.loadTasks();

    await waitFor(() => {
      expect(result.current.loadingTasks).toBe(false);
    });

    expect(result.current.tasks).toHaveLength(2);
    expect(result.current.tasks[0].id).toBe('1');
  });

  it('should not load tasks if no check-in exists', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useTasks(mockTodayMood, mockShowToast));

    result.current.loadTasks();

    await waitFor(() => {
      expect(result.current.loadingTasks).toBe(false);
    });

    expect(result.current.tasks).toEqual([]);
  });

  it('should group subtasks under main tasks', async () => {
    const mockUser = { id: 'user-123' };
    const mockMainTask: Task = {
      id: '1',
      content: 'Tarea principal',
      category: 'trabajo',
      is_completed: false,
      parent_task_id: null,
    };
    const mockSubtask: Task = {
      id: '2',
      content: 'Subtarea',
      category: 'trabajo',
      is_completed: false,
      parent_task_id: '1',
    };

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 'check-in-123' },
                error: null,
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [mockMainTask, mockSubtask],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

    const { result } = renderHook(() => useTasks(mockTodayMood, mockShowToast));

    result.current.loadTasks();

    await waitFor(() => {
      expect(result.current.loadingTasks).toBe(false);
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].subtasks).toBeDefined();
    expect(result.current.tasks[0].subtasks).toHaveLength(1);
    expect(result.current.tasks[0].subtasks?.[0].id).toBe('2');
  });

  it('should handle errors and show toast', async () => {
    const mockError = { message: 'Database error' };

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 'check-in-123' },
                error: null,
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: null,
                  error: mockError,
                }),
              }),
            }),
          }),
        }),
      });

    const { result } = renderHook(() => useTasks(mockTodayMood, mockShowToast));

    result.current.loadTasks();

    await waitFor(() => {
      expect(result.current.loadingTasks).toBe(false);
    });

    expect(mockShowToast).toHaveBeenCalledWith('Database error', 'error');
  });

  it('should prevent multiple simultaneous loads', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'check-in-123' },
              error: null,
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useTasks(mockTodayMood, mockShowToast));

    // Llamar múltiples veces rápidamente
    result.current.loadTasks();
    result.current.loadTasks();
    result.current.loadTasks();

    await waitFor(() => {
      expect(result.current.loadingTasks).toBe(false);
    });

    // Solo debería hacer una llamada real
    expect(supabase.from).toHaveBeenCalledTimes(2); // check-in + tasks
  });
});
