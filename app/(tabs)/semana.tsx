import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getWeeklyDistribution, type WeeklyDistribution } from '@/lib/weeklyReorganization';
import { logger } from '@/lib/logger';
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, Sparkles, Plus, Edit, Trash2, X } from 'lucide-react-native';
import { ProjectCard, type Project } from '@/components/projects/ProjectCard';
import { ProjectSelector } from '@/components/projects/ProjectSelector';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { detectCategory } from '@/lib/categoryDetection';
import { isNetworkError, getErrorMessage } from '@/lib/supabase';
import { Toast } from '@/components/Toast';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function SemanaScreen() {
  const { user } = useAuth();
  const [distribution, setDistribution] = useState<WeeklyDistribution>({});
  const [projects, setProjects] = useState<Map<string, Project>>(new Map());
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para agregar/editar tareas
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [taskContent, setTaskContent] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
  };

  const loadData = useCallback(async (showLoading = false) => {
    if (!user) return;

    try {
      if (showLoading) {
        setLoading(true);
      }

      // Load projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      if (projectsData) {
        const projectsMap = new Map<string, Project>();
        projectsData.forEach((p) => projectsMap.set(p.id, p));
        setProjects(projectsMap);
      }

      // Helper function to get week dates
      const getWeekDatesHelper = () => {
        const dates: string[] = [];
        const start = new Date(currentWeekStart);
        
        // Get Monday of the week
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust so Monday is 1
        const monday = new Date(start);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(monday);
          date.setDate(monday.getDate() + i);
          dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
      };

      // Load tasks scheduled for this week
      const weekDates = getWeekDatesHelper();
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .is('parent_task_id', null)
        .in('scheduled_date', weekDates)
        .order('scheduled_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (tasksError) {
        logger.error('Error loading tasks:', tasksError);
      }

      // Build distribution from scheduled tasks
      const weeklyData: WeeklyDistribution = {};
      weekDates.forEach((date) => {
        weeklyData[date] = {
          tasks: [],
          totalEstimatedTime: 0,
          projects: new Set(),
          energyLevel: 3,
        };
      });

      if (tasksData) {
        tasksData.forEach((task: any) => {
          if (task.scheduled_date && weeklyData[task.scheduled_date]) {
            weeklyData[task.scheduled_date].tasks.push(task);
            if (task.project_id) {
              weeklyData[task.scheduled_date].projects.add(task.project_id);
            }
          }
        });
      }

      setDistribution(weeklyData);
    } catch (error) {
      logger.error('Error loading weekly data:', error);
      // Mostrar error al usuario solo si no es la carga inicial
      if (!showLoading) {
        if (isNetworkError(error)) {
          showToast('Error de conexión al cargar datos', 'error');
        } else {
          showToast('Error al cargar los datos de la semana', 'error');
        }
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, [user, currentWeekStart]);

  useFocusEffect(
    useCallback(() => {
      loadData(true); // Mostrar loading solo en carga inicial
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false); // No mostrar loading en refresh
  }, [loadData]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(new Date());
  };

  const getWeekDates = () => {
    const dates: string[] = [];
    const start = new Date(currentWeekStart);
    
    // Get Monday of the week
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust so Monday is 1
    const monday = new Date(start);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const isToday = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  const getTaskProject = (task: any) => {
    if (task.project_id && projects.has(task.project_id)) {
      return projects.get(task.project_id)!;
    }
    return null;
  };

  const handleSaveTask = async () => {
    if (!user) {
      showToast('No hay usuario autenticado', 'error');
      return;
    }

    if (!selectedDay) {
      showToast('Por favor selecciona un día para la tarea', 'info');
      return;
    }

    if (!taskContent.trim()) {
      showToast('Por favor ingresa el contenido de la tarea', 'info');
      return;
    }

    setIsSaving(true);
    try {
      const detectedCategory = detectCategory(taskContent.trim());
      
      logger.debug('Creating task:', {
        content: taskContent.trim(),
        category: detectedCategory,
        project_id: selectedProjectId,
        scheduled_date: selectedDay,
      });

      if (editingTask) {
        // Actualizar tarea existente
        const { error } = await supabase
          .from('tasks')
          .update({
            content: taskContent.trim(),
            category: detectedCategory,
            project_id: selectedProjectId,
            scheduled_date: selectedDay,
          })
          .eq('id', editingTask.id)
          .eq('user_id', user.id);

        if (error) {
          setIsSaving(false);
          if (isNetworkError(error)) {
            showToast('Sin conexión. No se pudo actualizar la tarea', 'error');
          } else {
            logger.error('Error updating task:', error);
            showToast(`Error: ${getErrorMessage(error)}`, 'error');
          }
          return;
        }
        
        showToast('Tarea actualizada correctamente', 'success');
      } else {
        // Crear nueva tarea
        const { data: newTask, error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            content: taskContent.trim(),
            category: detectedCategory,
            is_completed: false,
            is_priority: false,
            parent_task_id: null,
            project_id: selectedProjectId,
            scheduled_date: selectedDay,
          })
          .select()
          .single();

        if (error) {
          setIsSaving(false);
          logger.error('Error creating task:', error);
          if (isNetworkError(error)) {
            showToast('Sin conexión. No se pudo crear la tarea', 'error');
          } else {
            showToast(`Error: ${getErrorMessage(error)}`, 'error');
          }
          return;
        }

        if (!newTask) {
          setIsSaving(false);
          logger.error('Task created but no data returned');
          showToast('La tarea se creó pero no se pudo obtener la información', 'error');
          return;
        }

        logger.debug('Task created successfully:', newTask.id);
        showToast('Tarea creada correctamente', 'success');
      }

      // Cerrar modal primero para mejor UX
      setShowTaskModal(false);
      setIsSaving(false);
      
      // Limpiar estados después de cerrar el modal
      setTimeout(() => {
        setEditingTask(null);
        setTaskContent('');
        setSelectedProjectId(null);
        setSelectedDay(null);
      }, 100);

      // Recargar datos después de cerrar el modal (sin mostrar loading)
      loadData(false).catch((error) => {
        logger.error('Error reloading data after save:', error);
        if (isNetworkError(error)) {
          showToast('Error de conexión al actualizar', 'error');
        } else {
          showToast('Error al actualizar los datos', 'error');
        }
      });
    } catch (error) {
      setIsSaving(false);
      logger.error('Unexpected error saving task:', error);
      showToast('Ocurrió un error inesperado. Por favor intenta de nuevo', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;

    Alert.alert(
      'Eliminar tarea',
      '¿Estás seguro de que quieres eliminar esta tarea?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId)
                .eq('user_id', user.id);

              if (error) {
                logger.error('Error deleting task:', error);
                if (isNetworkError(error)) {
                  showToast('Sin conexión. No se pudo eliminar la tarea', 'error');
                } else {
                  showToast('No se pudo eliminar la tarea', 'error');
                }
                return;
              }

              showToast('Tarea eliminada correctamente', 'success');
              await loadData(false);
            } catch (error) {
              logger.error('Unexpected error deleting task:', error);
              showToast('Ocurrió un error inesperado', 'error');
            }
          },
        },
      ]
    );
  };

  const weekDates = getWeekDates();
  const today = new Date().toISOString().split('T')[0];

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Calendar size={24} color={THEME.colors.gradient.blue} />
            <Text style={styles.headerTitle}>Semana</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/yo')}
            style={styles.projectsButton}
            accessibilityRole="button"
            accessibilityLabel="Gestionar proyectos"
          >
            <Sparkles size={20} color={THEME.colors.gradient.blue} />
          </TouchableOpacity>
        </View>

        {/* Week Navigation */}
        <View style={styles.weekNavigation}>
          <TouchableOpacity
            onPress={() => navigateWeek('prev')}
            style={styles.navButton}
            accessibilityRole="button"
            accessibilityLabel="Semana anterior"
          >
            <ChevronLeft size={20} color={THEME.colors.text.main} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToToday}
            style={styles.weekInfo}
            activeOpacity={0.7}
          >
            <Text style={styles.weekText}>
              {new Date(currentWeekStart).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
              })}{' '}
              -{' '}
              {new Date(weekDates[6]).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
              })}
            </Text>
            {!isToday(weekDates[0]) && (
              <Text style={styles.todayHint}>Toca para ir a hoy</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigateWeek('next')}
            style={styles.navButton}
            accessibilityRole="button"
            accessibilityLabel="Semana siguiente"
          >
            <ChevronRight size={20} color={THEME.colors.text.main} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
          {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando semana...</Text>
          </View>
        ) : (
          weekDates.map((date) => {
            const dayData = distribution[date] || {
              tasks: [],
              totalEstimatedTime: 0,
              projects: new Set(),
              energyLevel: 3,
            };
            const dayOfWeek = new Date(date).getDay();
            const isTodayDate = isToday(date);

            // Group tasks by project
            const tasksByProject = new Map<string | null, any[]>();
            dayData.tasks.forEach((task) => {
              const projectId = task.project_id || null;
              if (!tasksByProject.has(projectId)) {
                tasksByProject.set(projectId, []);
              }
              tasksByProject.get(projectId)!.push(task);
            });

            return (
              <View key={date} style={styles.dayCard}>
                <LinearGradient
                  colors={
                    isTodayDate
                      ? [THEME.colors.gradient.blue, THEME.colors.gradient.pink]
                      : [THEME.colors.fill[200], THEME.colors.fill[200]]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.dayHeader}
                >
                  <View style={styles.dayHeaderContent}>
                    <View>
                      <Text
                        style={[
                          styles.dayName,
                          isTodayDate && styles.todayDayName,
                        ]}
                      >
                        {DAY_NAMES_FULL[dayOfWeek]}
                      </Text>
                      <Text
                        style={[
                          styles.dayDate,
                          isTodayDate && styles.todayDayDate,
                        ]}
                      >
                        {new Date(date).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                    </View>
                    <View style={styles.dayStats}>
                      <View style={styles.energyBadge}>
                        <Text style={styles.energyText}>
                          ⚡ {dayData.energyLevel}/5
                        </Text>
                      </View>
                      <Text style={styles.taskCount}>
                        {dayData.tasks.length} {dayData.tasks.length === 1 ? 'tarea' : 'tareas'}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>

                {dayData.tasks.length === 0 ? (
                  <View style={styles.emptyDay}>
                    <Text style={styles.emptyDayText}>Sin tareas programadas</Text>
                    <TouchableOpacity
                      style={styles.addTaskButton}
                      onPress={() => {
                        setSelectedDay(date);
                        setEditingTask(null);
                        setTaskContent('');
                        setSelectedProjectId(null);
                        setShowTaskModal(true);
                      }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Agregar tarea para este día"
                    >
                      <Plus size={18} color={THEME.colors.gradient.blue} />
                      <Text style={styles.addTaskButtonText}>Agregar tarea</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.tasksContainer}>
                    {Array.from(tasksByProject.entries()).map(([projectId, tasks]) => {
                      const project = projectId ? projects.get(projectId) : null;

                      return (
                        <View key={projectId || 'no-project'} style={styles.projectSection}>
                          {project && (
                            <View style={styles.projectHeader}>
                              <View
                                style={[
                                  styles.projectColorDot,
                                  { backgroundColor: project.color },
                                ]}
                              />
                              <Text style={styles.projectName}>{project.name}</Text>
                            </View>
                          )}

                          {tasks.map((task) => (
                            <View key={task.id} style={styles.taskItemContainer}>
                              <TouchableOpacity
                                style={styles.taskItem}
                                onPress={() => {
                                  setEditingTask(task);
                                  setTaskContent(task.content);
                                  setSelectedProjectId(task.project_id);
                                  setSelectedDay(date);
                                  setShowTaskModal(true);
                                }}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                                accessibilityLabel={`Tarea: ${task.content}`}
                              >
                                <View
                                  style={[
                                    styles.taskCheckbox,
                                    task.is_completed && styles.taskCheckboxCompleted,
                                  ]}
                                />
                                <Text
                                  style={[
                                    styles.taskText,
                                    task.is_completed && styles.taskTextCompleted,
                                  ]}
                                  numberOfLines={2}
                                >
                                  {task.content}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.taskDeleteButton}
                                onPress={() => handleDeleteTask(task.id)}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                                accessibilityLabel="Eliminar tarea"
                              >
                                <Trash2 size={16} color={THEME.colors.gradient.pink} />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      );
                    })}
                    <TouchableOpacity
                      style={styles.addTaskButtonSmall}
                      onPress={() => {
                        setSelectedDay(date);
                        setEditingTask(null);
                        setTaskContent('');
                        setSelectedProjectId(null);
                        setShowTaskModal(true);
                      }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Agregar otra tarea"
                    >
                      <Plus size={16} color={THEME.colors.gradient.blue} />
                      <Text style={styles.addTaskButtonSmallText}>Agregar tarea</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Reorganize Button */}
        <TouchableOpacity
          onPress={async () => {
            if (!user) return;
            setRefreshing(true);
            try {
              const { reorganizeWeeklyTasks } = await import('@/lib/weeklyReorganization');
              await reorganizeWeeklyTasks(user.id);
              await loadData(false);
            } catch (error) {
              logger.error('Error reorganizing:', error);
            } finally {
              setRefreshing(false);
            }
          }}
          style={styles.reorganizeButton}
          accessibilityRole="button"
          accessibilityLabel="Reorganizar semana automáticamente"
        >
          <LinearGradient
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.reorganizeButtonGradient}
          >
            <RefreshCw size={20} color="#FFFFFF" />
            <Text style={styles.reorganizeButtonText}>Reorganizar Semana</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal para agregar/editar tarea */}
      <Modal
        visible={showTaskModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isSaving) {
            setShowTaskModal(false);
            setEditingTask(null);
            setTaskContent('');
            setSelectedProjectId(null);
            setSelectedDay(null);
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTask ? 'Editar tarea' : 'Nueva tarea'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (!isSaving) {
                    setShowTaskModal(false);
                    setEditingTask(null);
                    setTaskContent('');
                    setSelectedProjectId(null);
                    setSelectedDay(null);
                  }
                }}
                style={styles.closeButton}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <X size={24} color={THEME.colors.text.main} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedDay && (
                <View style={styles.selectedDayInfo}>
                  <Calendar size={16} color={THEME.colors.gradient.blue} />
                  <Text style={styles.selectedDayText}>
                    {new Date(selectedDay).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </Text>
                </View>
              )}

              <Text style={styles.modalLabel}>Contenido de la tarea</Text>
              <TextInput
                style={styles.modalInput}
                value={taskContent}
                onChangeText={setTaskContent}
                placeholder="Escribe la tarea..."
                placeholderTextColor={THEME.colors.text.secondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={300}
                editable={!isSaving}
              />

              {user && (
                <>
                  <Text style={styles.modalLabel}>Proyecto (opcional)</Text>
                  <ProjectSelector
                    selectedProjectId={selectedProjectId}
                    onSelect={(projectId) => {
                      setSelectedProjectId(projectId);
                      // Recargar proyectos cuando se selecciona uno nuevo (puede haber sido creado)
                      loadData(false).catch((error) => {
                        logger.error('Error reloading projects after selection:', error);
                      });
                    }}
                    userId={user.id}
                  />
                </>
              )}

              <TouchableOpacity
                style={[styles.saveButton, (!taskContent.trim() || !selectedDay || isSaving) && styles.saveButtonDisabled]}
                onPress={handleSaveTask}
                disabled={!taskContent.trim() || !selectedDay || isSaving}
                accessibilityRole="button"
                accessibilityLabel={editingTask ? "Guardar cambios" : "Crear tarea"}
              >
                <LinearGradient
                  colors={
                    !taskContent.trim() || isSaving
                      ? [THEME.colors.fill[200], THEME.colors.fill[200]]
                      : [THEME.colors.gradient.blue, THEME.colors.gradient.pink]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>
                    {isSaving ? 'Guardando...' : editingTask ? 'Guardar cambios' : 'Crear tarea'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Toast para feedback al usuario */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onHide={() => setToastMessage(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  header: {
    backgroundColor: THEME.colors.fill[100],
    paddingTop: THEME.spacing.xl,
    paddingBottom: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.fill[200],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  headerTitle: {
    ...THEME.typography.h1,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  projectsButton: {
    padding: THEME.spacing.sm,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: THEME.spacing.sm,
  },
  weekInfo: {
    flex: 1,
    alignItems: 'center',
  },
  weekText: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  todayHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: THEME.spacing.xl * 2,
    alignItems: 'center',
  },
  loadingText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  dayCard: {
    margin: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.fill[100],
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  dayHeader: {
    padding: THEME.spacing.md,
  },
  dayHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  todayDayName: {
    color: '#FFFFFF',
  },
  dayDate: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  todayDayDate: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  dayStats: {
    alignItems: 'flex-end',
    gap: 4,
  },
  energyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  energyText: {
    ...THEME.typography.caption,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 11,
  },
  taskCount: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontSize: 11,
  },
  emptyDay: {
    padding: THEME.spacing.xl,
    alignItems: 'center',
  },
  emptyDayText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
  },
  tasksContainer: {
    padding: THEME.spacing.md,
  },
  projectSection: {
    marginBottom: THEME.spacing.md,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
    gap: THEME.spacing.xs,
  },
  projectColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  projectName: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.sm,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    marginBottom: THEME.spacing.xs,
    gap: THEME.spacing.sm,
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: THEME.colors.text.secondary,
  },
  taskCheckboxCompleted: {
    backgroundColor: THEME.colors.gradient.blue,
    borderColor: THEME.colors.gradient.blue,
  },
  taskText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: THEME.colors.text.secondary,
  },
  reorganizeButton: {
    margin: THEME.spacing.lg,
    marginTop: THEME.spacing.xl,
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
  },
  reorganizeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  reorganizeButtonText: {
    ...THEME.typography.body,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
  },
  unscheduledSection: {
    margin: THEME.spacing.lg,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
  },
  unscheduledTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.xs,
  },
  unscheduledSubtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  taskItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  taskDeleteButton: {
    padding: THEME.spacing.xs,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: THEME.spacing.md,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    gap: THEME.spacing.xs,
  },
  addTaskButtonText: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  addTaskButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    gap: THEME.spacing.xs,
  },
  addTaskButtonSmallText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.fill[100],
    borderTopLeftRadius: THEME.borderRadius.rounded,
    borderTopRightRadius: THEME.borderRadius.rounded,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.fill[200],
  },
  modalTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  closeButton: {
    padding: THEME.spacing.xs,
  },
  modalScroll: {
    padding: THEME.spacing.lg,
  },
  selectedDayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.sm,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
  },
  selectedDayText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    textTransform: 'capitalize',
  },
  modalLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
    fontFamily: THEME.fonts.heading.medium,
  },
  modalInput: {
    ...THEME.typography.body,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.md,
    color: THEME.colors.text.main,
    minHeight: 100,
    marginBottom: THEME.spacing.md,
  },
  saveButton: {
    borderRadius: THEME.borderRadius.standard,
    overflow: 'hidden',
    marginTop: THEME.spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    padding: THEME.spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    ...THEME.typography.body,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
  },
});
