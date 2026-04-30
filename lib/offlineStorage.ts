import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { logger } from './logger';

const STORAGE_KEYS = {
  PENDING_CHECKINS: '@kora:pending_checkins',
  PENDING_TASKS: '@kora:pending_tasks',
  LAST_SYNC: '@kora:last_sync',
};

export interface PendingCheckIn {
  id: string;
  date: string;
  emotion: string;
  energy_level: number;
  available_time: string;
  focus_level: string;
  timestamp: number;
}

export interface PendingTask {
  id: string;
  content: string;
  category: string;
  is_priority: boolean;
  is_completed: boolean;
  parent_task_id: string | null;
  project_id: string | null;
  scheduled_date?: string | null;
  timestamp: number;
}

// Guardar check-in offline
export async function saveCheckInOffline(checkIn: Omit<PendingCheckIn, 'id' | 'timestamp'>): Promise<void> {
  try {
    const pendingCheckIns = await getPendingCheckIns();
    const newCheckIn: PendingCheckIn = {
      ...checkIn,
      id: `offline_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
    };
    
    pendingCheckIns.push(newCheckIn);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CHECKINS, JSON.stringify(pendingCheckIns));
  } catch (error) {
    logger.error('Error guardando check-in offline:', error);
  }
}

// Guardar tarea offline
export async function saveTaskOffline(task: Omit<PendingTask, 'id' | 'timestamp'>, customId?: string): Promise<string> {
  try {
    const pendingTasks = await getPendingTasks();
    const taskId = customId || `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTask: PendingTask = {
      ...task,
      id: taskId,
      timestamp: Date.now(),
    };
    
    pendingTasks.push(newTask);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_TASKS, JSON.stringify(pendingTasks));
    return taskId;
  } catch (error) {
    logger.error('Error guardando tarea offline:', error);
    throw error;
  }
}

// Obtener check-ins pendientes
export async function getPendingCheckIns(): Promise<PendingCheckIn[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_CHECKINS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    logger.error('Error obteniendo check-ins pendientes:', error);
    return [];
  }
}

// Obtener tareas pendientes
export async function getPendingTasks(): Promise<PendingTask[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_TASKS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    logger.error('Error obteniendo tareas pendientes:', error);
    return [];
  }
}

// Sincronizar check-ins pendientes con Supabase
export async function syncPendingCheckIns(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const pendingCheckIns = await getPendingCheckIns();
    if (pendingCheckIns.length === 0) return;

    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      logger.debug('Sin conexión, no se puede sincronizar');
      return;
    }

    const syncedIds: string[] = [];

    for (const checkIn of pendingCheckIns) {
      try {
        const { error } = await supabase
          .from('daily_check_ins')
          .upsert({
            user_id: user.id,
            date: checkIn.date,
            emotion: checkIn.emotion,
            energy_level: checkIn.energy_level,
            available_time: checkIn.available_time,
            focus_level: checkIn.focus_level,
          }, { onConflict: 'user_id,date' });

        if (!error) {
          syncedIds.push(checkIn.id);
        }
      } catch (error) {
        logger.error('Error sincronizando check-in:', error);
      }
    }

    // Remover check-ins sincronizados
    if (syncedIds.length > 0) {
      const remaining = pendingCheckIns.filter(ci => !syncedIds.includes(ci.id));
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CHECKINS, JSON.stringify(remaining));
    }
  } catch (error) {
    logger.error('Error en sincronización de check-ins:', error);
  }
}

// Sincronizar tareas pendientes con Supabase
export async function syncPendingTasks(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const pendingTasks = await getPendingTasks();
    if (pendingTasks.length === 0) return;

    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      logger.debug('Sin conexión, no se puede sincronizar');
      return;
    }

    const syncedIds: string[] = [];
    // Mapa de IDs temporales a IDs reales de Supabase
    const tempIdToRealId = new Map<string, string>();

    // Separar tareas principales y subtareas
    // Tareas principales: sin parent_task_id o con parent_task_id que no es temporal offline
    const mainTasks = pendingTasks.filter(t => 
      !t.parent_task_id || 
      (typeof t.parent_task_id === 'string' && !t.parent_task_id.startsWith('offline_'))
    );
    // Subtareas: con parent_task_id que es temporal offline
    const subtasks = pendingTasks.filter(t => 
      t.parent_task_id && 
      typeof t.parent_task_id === 'string' && 
      t.parent_task_id.startsWith('offline_')
    );

    // Primero sincronizar tareas principales
    for (const task of mainTasks) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            content: task.content,
            category: task.category,
            is_priority: task.is_priority,
            is_completed: task.is_completed,
            parent_task_id: null,
            project_id: task.project_id || null,
            scheduled_date: task.scheduled_date ?? null,
          })
          .select('id')
          .single();

        if (!error && data && data.id) {
          syncedIds.push(task.id);
          // Si la tarea tenía un ID temporal, guardar el mapeo
          if (typeof task.id === 'string' && task.id.startsWith('offline_')) {
            tempIdToRealId.set(task.id, data.id);
          }
        }
      } catch (error) {
        logger.error('Error sincronizando tarea:', error);
      }
    }

    // Luego sincronizar subtareas usando los IDs reales
    for (const task of subtasks) {
      try {
        // Validar que la tarea tenga parent_task_id válido
        if (!task.parent_task_id) {
          logger.error('Subtarea sin parent_task_id:', task.id);
          continue;
        }
        
        const realParentId = tempIdToRealId.get(task.parent_task_id);
        if (!realParentId) {
          logger.error('No se encontró ID real para tarea padre:', task.parent_task_id);
          // No continuar, dejar la subtarea pendiente para próxima sincronización
          continue;
        }

        const { error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            content: task.content,
            category: task.category,
            is_priority: task.is_priority,
            is_completed: task.is_completed,
            parent_task_id: realParentId,
            project_id: task.project_id || null,
            scheduled_date: task.scheduled_date ?? null,
          });

        if (!error) {
          syncedIds.push(task.id);
        }
      } catch (error) {
        logger.error('Error sincronizando subtarea:', error);
      }
    }

    // Remover tareas sincronizadas
    if (syncedIds.length > 0) {
      const remaining = pendingTasks.filter(t => !syncedIds.includes(t.id));
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_TASKS, JSON.stringify(remaining));
    }
  } catch (error) {
    logger.error('Error en sincronización de tareas:', error);
  }
}

// Sincronizar todo
export async function syncAll(): Promise<void> {
  try {
    await Promise.all([
      syncPendingCheckIns(),
      syncPendingTasks(),
    ]);
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
  } catch (error: unknown) {
    // Ignorar errores de AbortError (componente desmontado)
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
      return;
    }
    logger.error('Error en sincronización:', error);
  }
}

// Verificar conexión de red (versión simple sin NetInfo)
export async function checkNetworkConnection(): Promise<boolean> {
  try {
    // Intentar una query simple a Supabase para verificar conexión
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Query simple para verificar conexión
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .limit(1)
      .maybeSingle();
    
    // Si no hay error o el error no es de red, hay conexión
    return !error || (!error.message?.toLowerCase().includes('network') && 
                      !error.message?.toLowerCase().includes('fetch') &&
                      !error.message?.toLowerCase().includes('connection'));
  } catch (error) {
    logger.error('Error verificando conexión:', error);
    return false;
  }
}

// Limpiar datos offline (útil para testing)
export async function clearOfflineData(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.PENDING_CHECKINS,
    STORAGE_KEYS.PENDING_TASKS,
    STORAGE_KEYS.LAST_SYNC,
  ]);
}
