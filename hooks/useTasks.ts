import { useState, useCallback, useRef } from 'react';
import { supabase, getErrorMessage } from '@/lib/supabase';
import type { Task } from '@/components/tasks/TaskCard';

interface UseTasksReturn {
  tasks: Task[];
  loadingTasks: boolean;
  loadTasks: () => Promise<void>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useTasks(
  todayMood: string,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const isLoadingTasksRef = useRef<boolean>(false);

  const loadTasks = useCallback(async () => {
    // Prevenir múltiples llamadas simultáneas
    if (isLoadingTasksRef.current) {
      return;
    }
    
    try {
      isLoadingTasksRef.current = true;
      setLoadingTasks(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        isLoadingTasksRef.current = false;
        setLoadingTasks(false);
        return;
      }

      // Verificar si hay check-in hoy antes de cargar tareas priorizadas
      const today = new Date().toISOString().split('T')[0];
      const { data: checkInData } = await supabase
        .from('daily_check_ins')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      // Si no hay check-in, no cargar tareas priorizadas (mostrar vacío)
      if (!checkInData) {
        setTasks([]);
        setLoadingTasks(false);
        return;
      }

      // Cargar todas las tareas prioritarias (principales y subtareas)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_priority', true)
        .order('is_completed', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando tareas:', error);
        const errorMessage = getErrorMessage(error);
        showToast(errorMessage, 'error');
        return;
      }

      if (data) {
        // Separar tareas principales y subtareas
        const mainTasks = data.filter((task: Task) => !task.parent_task_id);
        const subtasks = data.filter((task: Task) => task.parent_task_id);

        // Agrupar subtareas bajo sus tareas principales
        const tasksWithSubtasks = mainTasks.map((task: Task) => {
          const taskSubtasks = subtasks.filter((st: Task) => st.parent_task_id === task.id);
          return {
            ...task,
            subtasks: taskSubtasks.length > 0 ? taskSubtasks : undefined,
          };
        });

        setTasks(tasksWithSubtasks);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      isLoadingTasksRef.current = false;
      setLoadingTasks(false);
    }
  }, [showToast, todayMood]);

  return {
    tasks,
    loadingTasks,
    loadTasks,
    setTasks,
    showToast,
  };
}
