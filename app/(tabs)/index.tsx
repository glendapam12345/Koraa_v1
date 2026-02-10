import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react-native';

type Task = {
  id: string;
  content: string;
  category: string;
  is_completed: boolean;
  parent_task_id: string | null;
  subtasks?: Task[];
};

export default function TodayScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [todayMood, setTodayMood] = useState<string>('');
  const [energy, setEnergy] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    loadTasks();
    loadTodayCheckIn();
  }, []);

  const loadTodayCheckIn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data: checkIn, error } = await supabase
        .from('daily_check_ins')
        .select('emotion, energy_level, available_time')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Error cargando check-in:', error);
        return;
      }

      if (checkIn) {
        setTodayMood(checkIn.emotion.toLowerCase());
        setEnergy(`${checkIn.energy_level}/5`);
        setEnergyLevel(checkIn.energy_level);
        setTime(checkIn.available_time);
      } else {
        setTodayMood('');
        setEnergy('');
        setEnergyLevel(0);
        setTime('');
      }
    } catch (error) {
      console.error('Error inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      setLoadingTasks(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        Alert.alert('Error', 'No se pudieron cargar las tareas');
        return;
      }

      if (data) {
        // Separar tareas principales y subtareas
        const mainTasks = data.filter(task => !task.parent_task_id);
        const subtasks = data.filter(task => task.parent_task_id);

        // Agrupar subtareas bajo sus tareas principales
        const tasksWithSubtasks = mainTasks.map(task => {
          const taskSubtasks = subtasks.filter(st => st.parent_task_id === task.id);
          return {
            ...task,
            subtasks: taskSubtasks.length > 0 ? taskSubtasks : undefined,
          };
        });

        setTasks(tasksWithSubtasks);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      Alert.alert('Error', 'Ocurrió un error al cargar las tareas');
    } finally {
      setLoadingTasks(false);
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const toggleTask = async (taskId: string, isSubtask: boolean = false, parentTaskId?: string) => {
    const task = isSubtask 
      ? tasks.find(t => t.id === parentTaskId)?.subtasks?.find(st => st.id === taskId)
      : tasks.find(t => t.id === taskId);
    
    if (!task) return;

    const newCompletedState = !task.is_completed;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          is_completed: newCompletedState,
          completed_at: newCompletedState ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error actualizando tarea:', error);
        Alert.alert('Error', 'No se pudo actualizar la tarea');
        return;
      }

      // Actualizar estado local y verificar si la tarea principal debe completarse
      if (isSubtask && parentTaskId) {
        // Actualizar subtarea y verificar estado de tarea principal
        const updatedTasks = tasks.map(t => {
          if (t.id === parentTaskId && t.subtasks) {
            const updatedSubtasks = t.subtasks.map(st =>
              st.id === taskId ? { ...st, is_completed: newCompletedState } : st
            );
            
            // Verificar si todas las subtareas están completadas
            const allSubtasksCompleted = updatedSubtasks.every(st => st.is_completed);
            const wasParentCompleted = t.is_completed;
            
            // Si todas las subtareas están completadas y la tarea principal no lo estaba
            if (allSubtasksCompleted && !wasParentCompleted) {
              // Marcar tarea principal como completada en la base de datos
              supabase
                .from('tasks')
                .update({
                  is_completed: true,
                  completed_at: new Date().toISOString(),
                })
                .eq('id', parentTaskId)
                .then(() => {
                  // Recargar después de actualizar
                  setTimeout(() => loadTasks(), 200);
                });
            } else if (!allSubtasksCompleted && wasParentCompleted) {
              // Desmarcar tarea principal si se desmarcó una subtarea
              supabase
                .from('tasks')
                .update({
                  is_completed: false,
                  completed_at: null,
                })
                .eq('id', parentTaskId)
                .then(() => {
                  setTimeout(() => loadTasks(), 200);
                });
            }
            
            return {
              ...t,
              subtasks: updatedSubtasks,
              is_completed: allSubtasksCompleted,
            };
          }
          return t;
        });
        
        setTasks(updatedTasks);
      } else {
        // Actualizar tarea principal
        setTasks(tasks.map(t =>
          t.id === taskId ? { ...t, is_completed: newCompletedState } : t
        ));
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar la tarea');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'trabajo':
        return '#4A90E2';
      case 'salud':
        return '#FF6B6B';
      case 'personal':
        return '#9B59B6';
      default:
        return THEME.colors.text.secondary;
    }
  };

  // Calcular tareas completadas y no completadas (solo tareas principales, no subtareas)
  const incompleteTasks = tasks.filter(t => !t.is_completed);
  const completedToday = tasks.filter(t => t.is_completed).length;
  const totalPriorityTasks = incompleteTasks.length + completedToday;
  const progressPercentage = totalPriorityTasks > 0 ? (completedToday / totalPriorityTasks) * 100 : 0;

  // Función para obtener mensaje explicativo basado en energía y emoción
  const getPriorityExplanation = () => {
    if (!todayMood || energyLevel === 0) {
      return {
        title: 'Tu plan de hoy',
        message: 'Haz tu check-in en "Sentir" para ver tus prioridades basadas en cómo te sientes.',
        suggestion: '',
      };
    }

    const negativeEmotions = ['agotada', 'ansiosa', 'abrumada'];
    const isNegativeEmotion = negativeEmotions.includes(todayMood.toLowerCase());

    let suggestion = '';
    if (energyLevel <= 2 || isNegativeEmotion) {
      suggestion = 'Menos es más cuando tu energía está baja. Enfócate en lo esencial.';
    } else if (energyLevel === 3) {
      suggestion = 'Tienes energía moderada. Prioriza lo importante.';
    } else if (energyLevel >= 4) {
      suggestion = '¡Tienes energía para más! Aprovecha este momento.';
    }

    const emotionLabel = todayMood.charAt(0).toUpperCase() + todayMood.slice(1);
    const priorityCount = incompleteTasks.length;

    return {
      title: 'Tu plan de hoy',
      message: `Con tu energía de ${energyLevel}/5 y sintiéndote ${emotionLabel}, te sugerimos enfocarte en ${priorityCount} ${priorityCount === 1 ? 'tarea prioritaria' : 'tareas prioritarias'} hoy.`,
      suggestion,
    };
  };

  const explanation = getPriorityExplanation();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.moodCard}
        >
          <View style={styles.moodHeader}>
            <View>
              <Text style={styles.moodLabel}>Hoy te sientes</Text>
              <Text style={styles.moodTitle}>
                {loading ? 'Cargando...' : todayMood || 'Aún no has hecho tu check-in'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                loadTasks();
                loadTodayCheckIn();
              }}
            >
              <RefreshCw size={20} color={THEME.colors.fill[100]} />
            </TouchableOpacity>
          </View>
          {!loading && (energy || time) && (
            <View style={styles.moodStats}>
              {energy && <Text style={styles.moodStat}>Energía: {energy}</Text>}
              {time && <Text style={styles.moodStat}>{time}</Text>}
            </View>
          )}
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{explanation.title}</Text>
          
          {/* Mensaje explicativo */}
          {incompleteTasks.length > 0 && (
            <View style={styles.explanationCard}>
              <Text style={styles.explanationText}>
                {explanation.message}
              </Text>
              {explanation.suggestion && (
                <Text style={styles.explanationSuggestion}>
                  {explanation.suggestion}
                </Text>
              )}
            </View>
          )}

          {/* Mensaje cuando no hay check-in o no hay tareas */}
          {(!todayMood || incompleteTasks.length === 0) && tasks.length === 0 && (
            <View style={styles.explanationCard}>
              <Text style={styles.explanationText}>
                {explanation.message}
              </Text>
            </View>
          )}

          {/* Indicador de progreso */}
          {totalPriorityTasks > 0 && (
            <View style={styles.progressIndicator}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  Progreso de hoy
                </Text>
                <Text style={styles.progressCount}>
                  {completedToday} de {totalPriorityTasks}
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${progressPercentage}%` }
                    ]} 
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.tasksContainer}>
          {loadingTasks ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
            </View>
          ) : tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No tienes tareas priorizadas aún.{'\n'}
                Ve a &ldquo;Vaciar&rdquo; para agregar tus pendientes.
              </Text>
            </View>
          ) : (
            (() => {
              // Separar tareas completadas y no completadas (ya calculado arriba)
              const completedTasks = tasks.filter(t => t.is_completed);
              
              const renderTask = (task: Task, index: number, isCompleted: boolean) => {
                const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                const isExpanded = expandedTasks.has(task.id);
                const completedSubtasks = hasSubtasks 
                  ? task.subtasks!.filter(st => st.is_completed).length 
                  : 0;
                const totalSubtasks = hasSubtasks ? task.subtasks!.length : 0;
                const subtasksProgress = totalSubtasks > 0 
                  ? (completedSubtasks / totalSubtasks) * 100 
                  : 0;

                return (
                  <View key={task.id}>
                    <TouchableOpacity
                      onPress={() => {
                        if (hasSubtasks) {
                          toggleTaskExpansion(task.id);
                        } else {
                          toggleTask(task.id);
                        }
                      }}
                      style={[
                        styles.taskCard,
                        isCompleted && styles.taskCardCompleted,
                        hasSubtasks && styles.taskCardWithSubtasks,
                      ]}
                      activeOpacity={0.7}
                    >
                      {/* Número de prioridad (solo para tareas no completadas) */}
                      {!isCompleted && (
                        <View style={styles.priorityNumberContainer}>
                          <View style={styles.priorityNumber}>
                            <Text style={styles.priorityNumberText}>{index + 1}</Text>
                          </View>
                        </View>
                      )}

                      {/* Botón expandir/colapsar si tiene subtareas */}
                      {hasSubtasks && (
                        <TouchableOpacity
                          onPress={() => toggleTaskExpansion(task.id)}
                          style={styles.expandButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          {isExpanded ? (
                            <ChevronUp size={20} color={THEME.colors.text.secondary} />
                          ) : (
                            <ChevronDown size={20} color={THEME.colors.text.secondary} />
                          )}
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => toggleTask(task.id)}
                        style={styles.taskCheckbox}
                        activeOpacity={0.7}
                      >
                        {task.is_completed && <View style={styles.taskCheckboxChecked} />}
                      </TouchableOpacity>
                      
                      <View style={styles.taskContent}>
                        <Text style={[
                          styles.taskText,
                          isCompleted && styles.taskTextCompleted,
                        ]}>
                          {task.content}
                        </Text>
                        
                        {/* Indicador de progreso de subtareas */}
                        {hasSubtasks && !isCompleted && (
                          <View style={styles.subtasksProgressContainer}>
                            <View style={styles.subtasksProgressBar}>
                              <View 
                                style={[
                                  styles.subtasksProgressFill,
                                  { width: `${subtasksProgress}%` }
                                ]} 
                              />
                            </View>
                            <Text style={styles.subtasksProgressText}>
                              {completedSubtasks} de {totalSubtasks} completadas
                            </Text>
                          </View>
                        )}
                        
                        {task.category && (
                          <View style={[
                            styles.categoryBadge,
                            { backgroundColor: getCategoryColor(task.category) + '20' },
                          ]}>
                            <Text style={[
                              styles.categoryText,
                              { color: getCategoryColor(task.category) },
                            ]}>
                              {task.category}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Renderizar subtareas si está expandido */}
                    {hasSubtasks && isExpanded && (
                      <View style={styles.subtasksContainer}>
                        {task.subtasks!.map((subtask) => (
                          <TouchableOpacity
                            key={subtask.id}
                            onPress={() => toggleTask(subtask.id, true, task.id)}
                            style={[
                              styles.subtaskCard,
                              subtask.is_completed && styles.subtaskCardCompleted,
                            ]}
                            activeOpacity={0.7}
                          >
                            <View style={styles.subtaskCheckbox}>
                              {subtask.is_completed && (
                                <View style={styles.subtaskCheckboxChecked} />
                              )}
                            </View>
                            <Text style={[
                              styles.subtaskText,
                              subtask.is_completed && styles.subtaskTextCompleted,
                            ]}>
                              {subtask.content}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              };
              
              return (
                <>
                  {/* Tareas no completadas con números */}
                  {incompleteTasks.map((task, index) => renderTask(task, index + 1, false))}
                  
                  {/* Tareas completadas sin números */}
                  {completedTasks.map((task, index) => renderTask(task, index + 1, true))}
                </>
              );
            })()
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  content: {
    padding: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl * 2,
  },
  moodCard: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  moodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.sm,
  },
  moodLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.fill[100],
    opacity: 0.9,
  },
  moodTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.fill[100],
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodStats: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  moodStat: {
    ...THEME.typography.caption,
    color: THEME.colors.fill[100],
    opacity: 0.9,
  },
  section: {
    marginBottom: THEME.spacing.md,
  },
  sectionTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  sectionSubtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
  },
  accentText: {
    fontFamily: THEME.fonts.accent.italic,
  },
  explanationCard: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  explanationText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    lineHeight: 24,
    marginBottom: THEME.spacing.xs,
  },
  explanationSuggestion: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.pink,
    fontFamily: THEME.fonts.heading.medium,
    marginTop: THEME.spacing.xs,
  },
  progressIndicator: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
  },
  progressLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  progressCount: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: THEME.colors.stroke[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.colors.gradient.blue,
    borderRadius: 4,
  },
  tasksContainer: {
    gap: THEME.spacing.sm,
  },
  emptyState: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  taskCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    ...THEME.shadows.soft,
  },
  priorityNumberContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityNumberText: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 16,
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckboxChecked: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: THEME.colors.gradient.blue,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: THEME.colors.text.secondary,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.medium,
  },
  taskCardWithSubtasks: {
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.gradient.blue,
  },
  expandButton: {
    padding: THEME.spacing.xs,
    marginRight: THEME.spacing.xs,
  },
  subtasksContainer: {
    marginLeft: THEME.spacing.lg,
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
    paddingLeft: THEME.spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: THEME.colors.stroke[100],
  },
  subtaskCard: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  subtaskCardCompleted: {
    opacity: 0.6,
  },
  subtaskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskCheckboxChecked: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.gradient.blue,
  },
  subtaskText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
    fontSize: 14,
  },
  subtaskTextCompleted: {
    textDecorationLine: 'line-through',
    color: THEME.colors.text.secondary,
  },
  subtasksProgressContainer: {
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  subtasksProgressBar: {
    height: 4,
    backgroundColor: THEME.colors.stroke[100],
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  subtasksProgressFill: {
    height: '100%',
    backgroundColor: THEME.colors.gradient.blue,
    borderRadius: 2,
  },
  subtasksProgressText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontSize: 11,
  },
});
