import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { supabase } from '@/lib/supabase';
import { X, Star } from 'lucide-react-native';

const CATEGORIES = [
  { id: 'trabajo', label: '💼 Trabajo', color: '#4A90E2' },
  { id: 'salud', label: '❤️ Salud', color: '#FF6B6B' },
  { id: 'personal', label: '👤 Personal', color: '#9B59B6' },
];

export default function VaciarScreen() {
  const [taskInput, setTaskInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isPriority, setIsPriority] = useState(false);
  const [recentTasks, setRecentTasks] = useState<string[]>([]);

  const handleAddTask = async () => {
    if (!taskInput.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      content: taskInput.trim(),
      category: selectedCategory,
      is_priority: isPriority,
      is_completed: false,
    });

    if (!error) {
      setRecentTasks([taskInput.trim(), ...recentTasks.slice(0, 4)]);
      setTaskInput('');
      setSelectedCategory('');
      setIsPriority(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Vacía tu mente en</Text>
        <Text style={styles.titleAccent}>un respiro</Text>

        <Text style={styles.subtitle}>
          Sin categorías. Sin etiquetas. Sin estructura.{'\n'}
          Solo escribe lo que necesitas soltar.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={taskInput}
            onChangeText={setTaskInput}
            placeholder="¿Qué necesitas hacer hoy?"
            placeholderTextColor={THEME.colors.text.secondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.categoriesContainer}>
          <Text style={styles.categoryLabel}>Opcional: Categoría</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(
                  selectedCategory === category.id ? '' : category.id
                )}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && {
                    backgroundColor: category.color + '20',
                    borderColor: category.color,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category.id && { color: category.color },
                ]}>
                  {category.label}
                </Text>
                {selectedCategory === category.id && (
                  <X size={16} color={category.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.priorityToggle,
            isPriority && styles.priorityToggleActive,
          ]}
          onPress={() => setIsPriority(!isPriority)}
          activeOpacity={0.7}
        >
          <Star
            size={20}
            color={isPriority ? THEME.colors.gradient.pink : THEME.colors.text.secondary}
            fill={isPriority ? THEME.colors.gradient.pink : 'none'}
          />
          <Text style={[
            styles.priorityToggleText,
            isPriority && styles.priorityToggleTextActive,
          ]}>
            Marcar como prioridad
          </Text>
        </TouchableOpacity>

        <GradientButton
          title="Soltar"
          onPress={handleAddTask}
          disabled={!taskInput.trim()}
        />

        {recentTasks.length > 0 && (
          <View style={styles.recentContainer}>
            <Text style={styles.recentTitle}>Recién agregado</Text>
            {recentTasks.map((task, index) => (
              <View key={index} style={styles.recentItem}>
                <Text style={styles.recentText}>{task}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  title: {
    ...THEME.typography.h1,
    color: THEME.colors.text.main,
  },
  titleAccent: {
    ...THEME.typography.h1,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.sm,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
    marginBottom: THEME.spacing.lg,
  },
  inputContainer: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  input: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    minHeight: 120,
  },
  categoriesContainer: {
    marginBottom: THEME.spacing.md,
  },
  categoryLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryChipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
  },
  recentContainer: {
    marginTop: THEME.spacing.lg,
  },
  recentTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.sm,
  },
  recentItem: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  recentText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  priorityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.stroke[100],
  },
  priorityToggleActive: {
    backgroundColor: THEME.colors.gradient.pink + '15',
    borderColor: THEME.colors.gradient.pink,
  },
  priorityToggleText: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
  },
  priorityToggleTextActive: {
    color: THEME.colors.gradient.pink,
    fontFamily: THEME.fonts.heading.bold,
  },
});
