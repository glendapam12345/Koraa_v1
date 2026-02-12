/**
 * Sistema de reorganización automática semanal
 * 
 * Distribuye tareas por proyecto a lo largo de la semana considerando:
 * - Prioridad del proyecto
 * - Energía histórica por día de la semana
 * - Tiempo disponible del check-in diario
 * - Balance entre proyectos
 * - Urgencia y deadlines
 */

import { supabase } from './supabase';
import { type Task, type CheckInData } from './smartPrioritization';

export interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string;
  priority: number; // 1-10, higher = more priority
}

export interface TaskWithProject extends Task {
  project_id: string | null;
  scheduled_date: string | null;
  project_priority?: number;
}

export interface WeeklyDistribution {
  [date: string]: {
    tasks: TaskWithProject[];
    totalEstimatedTime: number;
    projects: Set<string>;
    energyLevel: number; // Estimated energy for that day
  };
}

interface DayEnergyPattern {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  averageEnergy: number;
  availableTime: string;
}

/**
 * Obtiene el patrón de energía histórica por día de la semana
 */
async function getWeeklyEnergyPattern(userId: string): Promise<DayEnergyPattern[]> {
  try {
    // Obtener check-ins de las últimas 4 semanas
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const { data: checkIns } = await supabase
      .from('daily_check_ins')
      .select('date, energy_level, available_time')
      .eq('user_id', userId)
      .gte('date', fourWeeksAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (!checkIns || checkIns.length === 0) {
      // Default pattern if no history
      return [
        { dayOfWeek: 1, averageEnergy: 3, availableTime: 'Medio (2-4hrs)' }, // Monday
        { dayOfWeek: 2, averageEnergy: 3, availableTime: 'Medio (2-4hrs)' },
        { dayOfWeek: 3, averageEnergy: 3, availableTime: 'Medio (2-4hrs)' },
        { dayOfWeek: 4, averageEnergy: 3, availableTime: 'Medio (2-4hrs)' },
        { dayOfWeek: 5, averageEnergy: 3, availableTime: 'Medio (2-4hrs)' },
        { dayOfWeek: 6, averageEnergy: 4, availableTime: 'Bastante (4-6hrs)' }, // Saturday
        { dayOfWeek: 0, averageEnergy: 3, availableTime: 'Medio (2-4hrs)' }, // Sunday
      ];
    }

    // Agrupar por día de la semana y calcular promedio
    const dayPatterns = new Map<number, { energies: number[]; times: string[] }>();

    checkIns.forEach((checkIn) => {
      const date = new Date(checkIn.date);
      const dayOfWeek = date.getDay();
      
      if (!dayPatterns.has(dayOfWeek)) {
        dayPatterns.set(dayOfWeek, { energies: [], times: [] });
      }
      
      const pattern = dayPatterns.get(dayOfWeek)!;
      pattern.energies.push(checkIn.energy_level);
      pattern.times.push(checkIn.available_time);
    });

    // Calcular promedios
    const patterns: DayEnergyPattern[] = [];
    for (let day = 0; day < 7; day++) {
      const pattern = dayPatterns.get(day);
      if (pattern && pattern.energies.length > 0) {
        const avgEnergy = Math.round(
          pattern.energies.reduce((a, b) => a + b, 0) / pattern.energies.length
        );
        // Most common available time
        const timeCounts = new Map<string, number>();
        pattern.times.forEach((time) => {
          timeCounts.set(time, (timeCounts.get(time) || 0) + 1);
        });
        const mostCommonTime = Array.from(timeCounts.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Medio (2-4hrs)';

        patterns.push({
          dayOfWeek: day,
          averageEnergy: avgEnergy,
          availableTime: mostCommonTime,
        });
      } else {
        // Default for days without history
        patterns.push({
          dayOfWeek: day,
          averageEnergy: 3,
          availableTime: 'Medio (2-4hrs)',
        });
      }
    }

    return patterns;
  } catch (error) {
    console.error('Error getting weekly energy pattern:', error);
    // Return default pattern
    return [
      { dayOfWeek: 1, averageEnergy: 3, availableTime: 'Medio (2-4hrs)' },
      { dayOfWeek: 2, averageEnergy: 3, availableTime: 'Medio (2-4hrs)' },
      { dayOfWeek: 3, averageEnergy: 3, availableTime: 'Medio (2-4hrs)' },
      { dayOfWeek: 4, averageEnergy: 3, availableTime: 'Medio (2-4hrs)' },
      { dayOfWeek: 5, averageEnergy: 3, availableTime: 'Medio (2-4hrs)' },
      { dayOfWeek: 6, averageEnergy: 4, availableTime: 'Bastante (4-6hrs)' },
      { dayOfWeek: 0, averageEnergy: 3, availableTime: 'Medio (2-4hrs)' },
    ];
  }
}

/**
 * Estima la duración de una tarea en minutos
 */
function estimateTaskDuration(task: TaskWithProject): number {
  const wordCount = task.content.split(' ').length;
  const longKeywords = ['crear', 'desarrollar', 'diseñar', 'proyecto', 'presentación', 'reporte'];
  const hasLongKeyword = longKeywords.some((keyword) =>
    task.content.toLowerCase().includes(keyword)
  );

  if (hasLongKeyword || wordCount >= 15) {
    return 90; // 90 minutos
  } else if (wordCount < 5) {
    return 15; // 15 minutos
  }
  return 45; // 45 minutos default
}

/**
 * Convierte tiempo disponible a minutos
 */
function getTimeInMinutes(availableTime: string): number {
  switch (availableTime) {
    case 'Poco (1-2hrs)':
      return 90; // 1.5 horas
    case 'Medio (2-4hrs)':
      return 180; // 3 horas
    case 'Bastante (4-6hrs)':
      return 300; // 5 horas
    case 'Todo el día':
      return 480; // 8 horas
    default:
      return 180;
  }
}

/**
 * Obtiene las próximas 7 fechas (semana actual)
 */
function getWeekDates(startDate: Date = new Date()): string[] {
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  
  // Start from today
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * Reorganiza tareas automáticamente distribuyéndolas a lo largo de la semana
 */
export async function reorganizeWeeklyTasks(
  userId: string,
  currentCheckIn?: CheckInData
): Promise<void> {
  try {
    // 1. Obtener todas las tareas no completadas
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .is('parent_task_id', null) // Solo tareas principales
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return;
    }

    if (!tasks || tasks.length === 0) {
      return; // No hay tareas para reorganizar
    }

    // 2. Obtener proyectos
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return;
    }

    const projectsMap = new Map<string, Project>();
    if (projects) {
      projects.forEach((p) => projectsMap.set(p.id, p));
    }

    // 3. Agrupar tareas por proyecto
    const tasksByProject = new Map<string | null, TaskWithProject[]>();
    tasks.forEach((task: any) => {
      const projectId = task.project_id || null;
      if (!tasksByProject.has(projectId)) {
        tasksByProject.set(projectId, []);
      }
      tasksByProject.get(projectId)!.push({
        ...task,
        project_id: task.project_id,
        scheduled_date: task.scheduled_date,
        project_priority: task.project_priority || 5,
      });
    });

    // 4. Obtener patrón de energía semanal
    const energyPatterns = await getWeeklyEnergyPattern(userId);
    const weekDates = getWeekDates();

    // 5. Crear distribución semanal
    const distribution: WeeklyDistribution = {};
    weekDates.forEach((date) => {
      const dayOfWeek = new Date(date).getDay();
      const pattern = energyPatterns.find((p) => p.dayOfWeek === dayOfWeek) || {
        averageEnergy: 3,
        availableTime: 'Medio (2-4hrs)',
      };

      distribution[date] = {
        tasks: [],
        totalEstimatedTime: 0,
        projects: new Set(),
        energyLevel: pattern.averageEnergy,
      };
    });

    // 6. Distribuir tareas considerando:
    //    - Prioridad del proyecto
    //    - Prioridad de la tarea dentro del proyecto
    //    - Energía del día
    //    - Tiempo disponible
    //    - Balance entre proyectos

    // Ordenar proyectos por prioridad
    const sortedProjects = Array.from(projectsMap.values()).sort(
      (a, b) => b.priority - a.priority
    );

    // También considerar tareas sin proyecto
    const allProjectIds = [null, ...sortedProjects.map((p) => p.id)];

    for (const projectId of allProjectIds) {
      const projectTasks = tasksByProject.get(projectId) || [];
      
      // Ordenar tareas del proyecto por prioridad y fecha de creación
      projectTasks.sort((a, b) => {
        const priorityDiff = (b.project_priority || 5) - (a.project_priority || 5);
        if (priorityDiff !== 0) return priorityDiff;
        
        // Si tienen la misma prioridad, las más recientes primero
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return 0;
      });

      // Distribuir tareas del proyecto a lo largo de la semana
      for (const task of projectTasks) {
        let bestDate: string | null = null;
        let bestScore = -Infinity;

        // Encontrar el mejor día para esta tarea
        for (const date of weekDates) {
          const dayData = distribution[date];
          const dayOfWeek = new Date(date).getDay();
          const pattern = energyPatterns.find((p) => p.dayOfWeek === dayOfWeek) || {
            averageEnergy: 3,
            availableTime: 'Medio (2-4hrs)',
          };

          // Calcular score para este día
          let score = 0;

          // Preferir días con más energía para proyectos importantes
          if (projectId && projectsMap.has(projectId)) {
            const project = projectsMap.get(projectId)!;
            if (project.priority >= 7) {
              score += pattern.averageEnergy * 10; // Proyectos importantes en días con más energía
            }
          }

          // Preferir días con menos tareas ya asignadas
          score += (10 - dayData.tasks.length) * 5;

          // Preferir días donde el proyecto no está sobre-representado
          const projectCount = Array.from(dayData.tasks).filter(
            (t) => t.project_id === projectId
          ).length;
          score -= projectCount * 3;

          // Verificar que la tarea cabe en el tiempo disponible
          const taskDuration = estimateTaskDuration(task);
          const availableMinutes = getTimeInMinutes(pattern.availableTime);
          const remainingTime = availableMinutes - dayData.totalEstimatedTime;

          if (taskDuration <= remainingTime) {
            score += 20; // Bonus si cabe
          } else {
            score -= 50; // Penalización si no cabe
          }

          // Preferir días con menos proyectos diferentes (más enfoque)
          score -= dayData.projects.size * 2;

          if (score > bestScore) {
            bestScore = score;
            bestDate = date;
          }
        }

        // Asignar tarea al mejor día
        if (bestDate) {
          const dayData = distribution[bestDate];
          dayData.tasks.push(task);
          dayData.totalEstimatedTime += estimateTaskDuration(task);
          if (projectId) {
            dayData.projects.add(projectId);
          }
        }
      }
    }

    // 7. Actualizar scheduled_date de todas las tareas
    const updates: Array<{ id: string; scheduled_date: string | null }> = [];

    for (const date of weekDates) {
      const dayData = distribution[date];
      dayData.tasks.forEach((task) => {
        updates.push({
          id: task.id,
          scheduled_date: date,
        });
      });
    }

    // También actualizar tareas que no fueron asignadas (quedan sin fecha)
    const assignedTaskIds = new Set(
      weekDates.flatMap((date) => distribution[date].tasks.map((t) => t.id))
    );
    tasks.forEach((task: any) => {
      if (!assignedTaskIds.has(task.id)) {
        updates.push({
          id: task.id,
          scheduled_date: null, // Sin fecha programada
        });
      }
    });

    // Actualizar en batch
    for (const update of updates) {
      await supabase
        .from('tasks')
        .update({ scheduled_date: update.scheduled_date })
        .eq('id', update.id);
    }
  } catch (error) {
    console.error('Error reorganizing weekly tasks:', error);
  }
}

/**
 * Obtiene la distribución semanal actual
 */
export async function getWeeklyDistribution(
  userId: string,
  startDate: Date = new Date()
): Promise<WeeklyDistribution> {
  const weekDates = getWeekDates(startDate);
  const distribution: WeeklyDistribution = {};

  // Inicializar distribución
  weekDates.forEach((date) => {
    distribution[date] = {
      tasks: [],
      totalEstimatedTime: 0,
      projects: new Set(),
      energyLevel: 3,
    };
  });

  // Obtener tareas programadas para esta semana
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_completed', false)
    .is('parent_task_id', null)
    .in('scheduled_date', weekDates)
    .order('project_priority', { ascending: false });

  if (tasks) {
    tasks.forEach((task: any) => {
      if (task.scheduled_date && distribution[task.scheduled_date]) {
        const dayData = distribution[task.scheduled_date];
        dayData.tasks.push({
          ...task,
          project_id: task.project_id,
          scheduled_date: task.scheduled_date,
          project_priority: task.project_priority || 5,
        });
        dayData.totalEstimatedTime += estimateTaskDuration(task);
        if (task.project_id) {
          dayData.projects.add(task.project_id);
        }
      }
    });
  }

  // Obtener patrones de energía
  const energyPatterns = await getWeeklyEnergyPattern(userId);
  weekDates.forEach((date) => {
    const dayOfWeek = new Date(date).getDay();
    const pattern = energyPatterns.find((p) => p.dayOfWeek === dayOfWeek);
    if (pattern) {
      distribution[date].energyLevel = pattern.averageEnergy;
    }
  });

  return distribution;
}
