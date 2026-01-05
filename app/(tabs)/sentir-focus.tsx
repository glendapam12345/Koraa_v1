import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { Focus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const FOCUS_OPTIONS = [
  { id: 'Muy distraída', label: 'Muy distraída' },
  { id: 'Algo distraída', label: 'Algo distraída' },
  { id: 'Normal', label: 'Normal' },
  { id: 'Enfocada', label: 'Enfocada' },
  { id: 'Súper enfocada', label: 'Súper enfocada' },
];

export default function SentirFocusScreen() {
  const { emotion, energy, time } = useLocalSearchParams<{ emotion: string; energy: string; time: string }>();
  const { user } = useAuth();
  const [selectedFocus, setSelectedFocus] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCheckIn = async () => {
    if (!selectedFocus || !emotion || !energy || !time || !user) return;

    setIsSaving(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Guardar check-in
      const { error: checkInError } = await supabase
        .from('daily_check_ins')
        .upsert({
          user_id: user.id,
          date: today,
          emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
          energy_level: parseInt(energy),
          available_time: time,
          focus_level: selectedFocus,
        }, { onConflict: 'user_id,date' });

      if (checkInError) {
        console.error('Error guardando check-in:', checkInError);
        setIsSaving(false);
        return;
      }

      // Priorizar tareas automáticamente basado en el check-in
      await prioritizeTasksBasedOnCheckIn(parseInt(energy), emotion);

      // Redirigir a Hoy
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error:', error);
      setIsSaving(false);
    }
  };

  const prioritizeTasksBasedOnCheckIn = async (energyLevel: number, emotion: string) => {
    if (!user) return;

    // Obtener todas las tareas no completadas
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_completed', false)
      .order('created_at', { ascending: false });

    if (!tasks || tasks.length === 0) return;

    // Lógica de priorización:
    // - Si energía es baja (1-2): priorizar menos tareas (máximo 2)
    // - Si energía es media (3): priorizar algunas tareas (máximo 3)
    // - Si energía es alta (4-5): priorizar más tareas (máximo 4-5)
    // - Emociones negativas (Agotada, Ansiosa, Abrumada): priorizar menos
    // - Emociones positivas (Tranquila, Enfocada, Motivada): priorizar más

    const negativeEmotions = ['agotada', 'ansiosa', 'abrumada'];
    const isNegativeEmotion = negativeEmotions.includes(emotion.toLowerCase());

    let maxPriorityTasks = 4;
    if (energyLevel <= 2 || isNegativeEmotion) {
      maxPriorityTasks = 2;
    } else if (energyLevel === 3) {
      maxPriorityTasks = 3;
    } else if (energyLevel >= 4) {
      maxPriorityTasks = 5;
    }

    // Primero, quitar prioridad a todas las tareas
    await supabase
      .from('tasks')
      .update({ is_priority: false })
      .eq('user_id', user.id)
      .eq('is_completed', false);

    // Luego, priorizar las primeras N tareas según la energía
    const tasksToPrioritize = tasks.slice(0, maxPriorityTasks);
    
    if (tasksToPrioritize.length > 0) {
      const taskIds = tasksToPrioritize.map(t => t.id);
      await supabase
        .from('tasks')
        .update({ is_priority: true })
        .in('id', taskIds);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Focus size={32} color={THEME.colors.gradient.pink} />
          </View>
        </View>

        <Text style={styles.title}>¿Qué tan</Text>
        <Text style={styles.titleAccent}>enfocada</Text>
        <Text style={styles.subtitle}>te sientes?</Text>

        <View style={styles.optionsContainer}>
          {FOCUS_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => setSelectedFocus(option.id)}
              style={[
                styles.option,
                selectedFocus === option.id && styles.optionSelected,
              ]}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.optionText,
                selectedFocus === option.id && styles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title={isSaving ? "Guardando..." : "Guardar →"}
          onPress={handleSaveCheckIn}
          disabled={!selectedFocus || isSaving}
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
  iconContainer: {
    alignItems: 'flex-end',
    marginBottom: THEME.spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.fill[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...THEME.typography.h1,
    color: THEME.colors.text.main,
  },
  titleAccent: {
    ...THEME.typography.h1,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.text.main,
  },
  subtitle: {
    ...THEME.typography.h1,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.lg,
  },
  optionsContainer: {
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
  },
  option: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    ...THEME.shadows.soft,
  },
  optionSelected: {
    borderWidth: 2,
    borderColor: THEME.colors.gradient.blue,
  },
  optionText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
  },
  optionTextSelected: {
    fontFamily: THEME.fonts.heading.bold,
  },
  footer: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
});
