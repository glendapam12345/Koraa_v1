import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { Battery } from 'lucide-react-native';

const ENERGY_LEVELS = [
  { id: 1, label: 'Muy baja', bars: 1 },
  { id: 2, label: 'Baja', bars: 2 },
  { id: 3, label: 'Media', bars: 3 },
  { id: 4, label: 'Alta', bars: 4 },
  { id: 5, label: 'Muy alta', bars: 5 },
];

export default function SentirEnergyScreen() {
  const { emotion } = useLocalSearchParams<{ emotion: string }>();
  const [selectedEnergy, setSelectedEnergy] = useState<number>(0);

  const handleContinue = () => {
    if (selectedEnergy > 0 && emotion) {
      router.push({
        pathname: '/(tabs)/sentir-time',
        params: { emotion, energy: selectedEnergy.toString() },
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Battery size={32} color={THEME.colors.gradient.pink} />
          </View>
        </View>

        <Text style={styles.title}>¿Cuánta</Text>
        <Text style={styles.titleAccent}>energía</Text>
        <Text style={styles.subtitle}>tienes?</Text>

        <View style={styles.optionsContainer}>
          {ENERGY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              onPress={() => setSelectedEnergy(level.id)}
              style={[
                styles.option,
                selectedEnergy === level.id && styles.optionSelected,
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.barsContainer}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.bar,
                      index < level.bars && styles.barActive,
                      selectedEnergy === level.id && index < level.bars && styles.barSelected,
                    ]}
                  />
                ))}
              </View>
              <Text style={[
                styles.optionText,
                selectedEnergy === level.id && styles.optionTextSelected,
              ]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title="Continuar →"
          onPress={handleContinue}
          disabled={selectedEnergy === 0}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    ...THEME.shadows.soft,
  },
  optionSelected: {
    borderWidth: 2,
    borderColor: THEME.colors.gradient.blue,
  },
  barsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    width: 8,
    height: 24,
    borderRadius: 4,
    backgroundColor: THEME.colors.stroke[100],
  },
  barActive: {
    backgroundColor: THEME.colors.text.secondary,
  },
  barSelected: {
    backgroundColor: THEME.colors.gradient.blue,
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
