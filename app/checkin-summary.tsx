import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, Sparkles } from 'lucide-react-native';

const EMOTIONS = [
  { id: 'agotada', emoji: '😔', label: 'Agotada', color: ['#667eea', '#764ba2'] as const },
  { id: 'tranquila', emoji: '😌', label: 'Tranquila', color: ['#f093fb', '#f5576c'] as const },
  { id: 'ansiosa', emoji: '😰', label: 'Ansiosa', color: ['#fa709a', '#fee140'] as const },
  { id: 'motivada', emoji: '✨', label: 'Motivada', color: ['#30cfd0', '#330867'] as const },
  { id: 'abrumada', emoji: '🥺', label: 'Abrumada', color: ['#a8edea', '#fed6e3'] as const },
  { id: 'enfocada', emoji: '🎯', label: 'Enfocada', color: ['#667eea', '#764ba2'] as const },
];

type Task = {
  id: string;
  content: string;
  category: string;
  parent_task_id: string | null;
};

export default function CheckInSummaryScreen() {
  const { emotion, energy, time, focus } = useLocalSearchParams<{
    emotion: string;
    energy: string;
    time: string;
    focus: string;
  }>();
  const { user } = useAuth();
  const [prioritizedTasks, setPrioritizedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPrioritizedTasks();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadPrioritizedTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, content, category, parent_task_id')
        .eq('user_id', user.id)
        .eq('is_priority', true)
        .eq('is_completed', false)
        .is('parent_task_id', null) // Solo tareas principales
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando tareas:', error);
        return;
      }

      if (data) {
        setPrioritizedTasks(data);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmotionData = () => {
    return EMOTIONS.find(e => e.id === emotion?.toLowerCase()) || EMOTIONS[0];
  };

  const getMotivationalMessage = () => {
    const emotionData = getEmotionData();
    const energyLevel = parseInt(energy || '3');
    
    if (emotionData.id === 'agotada' || emotionData.id === 'abrumada') {
      return 'Tómalo con calma. Priorizamos solo lo esencial para hoy.';
    } else if (emotionData.id === 'ansiosa') {
      return 'Respira. Enfócate en estas tareas, una a la vez.';
    } else if (emotionData.id === 'motivada' || emotionData.id === 'enfocada') {
      return '¡Perfecto! Estás lista para conquistar el día.';
    } else if (emotionData.id === 'tranquila') {
      return 'Día tranquilo. Priorizamos tareas que fluyan bien.';
    }
    
    return 'Basado en cómo te sientes, priorizamos tus tareas.';
  };

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  const emotionData = getEmotionData();
  const energyLevel = parseInt(energy || '3');

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header con emoji grande */}
        <View style={styles.header}>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{emotionData.emoji}</Text>
          </View>
          <Text style={styles.title}>¡Check-in</Text>
          <Text style={styles.titleAccent}>completado!</Text>
        </View>

        {/* Resumen del estado */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={emotionData.color as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Te sientes</Text>
              <Text style={styles.summaryValue}>{emotionData.label}</Text>
              
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Energía</Text>
                  <Text style={styles.summaryItemValue}>{energyLevel}/5</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Tiempo</Text>
                  <Text style={styles.summaryItemValue}>{time || 'No especificado'}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Enfoque</Text>
                  <Text style={styles.summaryItemValue}>{focus || 'No especificado'}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Mensaje motivacional */}
        <View style={styles.messageCard}>
          <Sparkles size={20} color={THEME.colors.gradient.blue} />
          <Text style={styles.messageText}>{getMotivationalMessage()}</Text>
        </View>

        {/* Tareas priorizadas */}
        {prioritizedTasks.length > 0 ? (
          <View style={styles.tasksCard}>
            <View style={styles.tasksHeader}>
              <CheckCircle2 size={24} color={THEME.colors.gradient.blue} />
              <Text style={styles.tasksTitle}>
                {prioritizedTasks.length} {prioritizedTasks.length === 1 ? 'tarea priorizada' : 'tareas priorizadas'}
              </Text>
            </View>
            
            <View style={styles.tasksList}>
              {prioritizedTasks.slice(0, 5).map((task, index) => (
                <View key={task.id} style={styles.taskItem}>
                  <View style={styles.taskNumber}>
                    <Text style={styles.taskNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.taskText} numberOfLines={2}>
                    {task.content}
                  </Text>
                </View>
              ))}
            </View>
            
            {prioritizedTasks.length > 5 && (
              <Text style={styles.moreTasksText}>
                +{prioritizedTasks.length - 5} más tareas
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.noTasksCard}>
            <Text style={styles.noTasksText}>
              No hay tareas para priorizar aún.{'\n'}
              Agrega tareas en &quot;Vaciar&quot; para verlas aquí.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title="Ver mis prioridades →"
          onPress={handleContinue}
        />
      </View>
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
  header: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: THEME.colors.fill[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    ...THEME.typography.h1,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  titleAccent: {
    ...THEME.typography.h1,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  summaryCard: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    marginBottom: THEME.spacing.lg,
    ...THEME.shadows.soft,
  },
  summaryGradient: {
    padding: THEME.spacing.lg,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradientMuted,
    marginBottom: THEME.spacing.xs,
  },
  summaryValue: {
    ...THEME.typography.h2,
    color: THEME.colors.onGradient,
    marginBottom: THEME.spacing.md,
    fontFamily: THEME.fonts.heading.bold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: THEME.spacing.sm,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryItemLabel: {
    ...THEME.typography.small,
    color: THEME.colors.onGradientMuted,
    marginBottom: 4,
  },
  summaryItemValue: {
    ...THEME.typography.body,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  messageText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
  },
  tasksCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    ...THEME.shadows.soft,
  },
  tasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  tasksTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
  },
  tasksList: {
    gap: THEME.spacing.sm,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  taskNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskNumberText: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  taskText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    flex: 1,
  },
  moreTasksText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginTop: THEME.spacing.sm,
  },
  noTasksCard: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
  },
  noTasksText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  footer: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
});
