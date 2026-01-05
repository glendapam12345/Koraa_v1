import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { Focus } from 'lucide-react-native';

const FOCUS_OPTIONS = [
  { id: 'muy_distraida', label: 'Muy distraída' },
  { id: 'algo_distraida', label: 'Algo distraída' },
  { id: 'normal', label: 'Normal' },
  { id: 'enfocada', label: 'Enfocada' },
  { id: 'super_enfocada', label: 'Súper enfocada' },
];

export default function FocusScreen() {
  const [selectedFocus, setSelectedFocus] = useState<string>('');

  const handleContinue = () => {
    if (selectedFocus) {
      router.replace('/(tabs)');
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
          title="Comenzar →"
          onPress={handleContinue}
          disabled={!selectedFocus}
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
