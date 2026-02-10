import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react-native';

type Task = {
  id: string;
  content: string;
  category: string;
  is_completed: boolean;
};

export default function TodayScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayMood, setTodayMood] = useState<string>('');
  const [energy, setEnergy] = useState<string>('');
  const [time, setTime] = useState<string>('');
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
        setTime(checkIn.available_time);
      } else {
        setTodayMood('');
        setEnergy('');
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

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .eq('is_priority', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando tareas:', error);
        Alert.alert('Error', 'No se pudieron cargar las tareas');
        return;
      }

      if (data) {
        setTasks(data);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      Alert.alert('Error', 'Ocurrió un error al cargar las tareas');
    } finally {
      setLoadingTasks(false);
    }
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
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

      // Si se marca como completada, removerla de la lista
      if (newCompletedState) {
        setTasks(tasks.filter(t => t.id !== taskId));
      } else {
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
          <Text style={styles.sectionTitle}>Tu enfoque de hoy</Text>
          <Text style={styles.sectionSubtitle}>
            Basado en cómo te sientes, estas son tus{' '}
            <Text style={styles.accentText}>prioridades</Text> de hoy.
          </Text>
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
                Ve a "Vaciar" para agregar tus pendientes.
              </Text>
            </View>
          ) : (
            tasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                onPress={() => toggleTask(task.id)}
                style={[
                  styles.taskCard,
                  task.is_completed && styles.taskCardCompleted,
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.taskCheckbox}>
                  {task.is_completed && <View style={styles.taskCheckboxChecked} />}
                </View>
                <View style={styles.taskContent}>
                  <Text style={[
                    styles.taskText,
                    task.is_completed && styles.taskTextCompleted,
                  ]}>
                    {task.content}
                  </Text>
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
            ))
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
});
