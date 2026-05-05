import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { Sparkles, ArrowDown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { markOnboardingCompleted } from '@/lib/onboardingGate';

export default function WelcomeScreen() {
  const { user } = useAuth();
  const [skipLoading, setSkipLoading] = useState(false);

  const handleSkipIntro = async () => {
    if (!user?.id) {
      router.replace('/auth/login');
      return;
    }
    setSkipLoading(true);
    const { error } = await markOnboardingCompleted(user.id);
    setSkipLoading(false);
    if (error) {
      Alert.alert(
        'No se pudo continuar',
        'No pudimos guardar tu progreso. Inténtalo de nuevo.',
      );
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Sparkles size={32} color={THEME.colors.gradient.blue} />
          </View>
        </View>

        <Text style={styles.title}>Organiza tu día</Text>
        <Text style={styles.titleAccent}>sintiendo</Text>
        <Text style={styles.subtitle}>en lugar de estructurando</Text>

        <Text style={styles.description}>
          Deja de perder energía organizándote.{'\n'}
          Solo di cómo te sientes hoy.
        </Text>

        {/* Ejemplo visual de priorización */}
        <View style={styles.exampleContainer}>
          <View style={styles.exampleCard}>
            <View style={styles.exampleHeader}>
              <Text style={styles.exampleEmoji}>😔</Text>
              <Text style={styles.exampleTitle}>Te sientes agotada</Text>
            </View>
            <Text style={styles.exampleSubtitle}>Energía: 2/5</Text>
            <View style={styles.exampleDivider} />
            <Text style={styles.exampleResult}>
              Koraa prioriza solo 2 tareas esenciales
            </Text>
          </View>

          <View style={styles.arrowDown}>
            <ArrowDown size={20} color={THEME.colors.text.secondary} />
          </View>

          <View style={styles.exampleCard}>
            <View style={styles.exampleHeader}>
              <Text style={styles.exampleEmoji}>✨</Text>
              <Text style={styles.exampleTitle}>Te sientes motivada</Text>
            </View>
            <Text style={styles.exampleSubtitle}>Energía: 5/5</Text>
            <View style={styles.exampleDivider} />
            <Text style={styles.exampleResult}>
              Koraa prioriza hasta 5 tareas
            </Text>
          </View>
        </View>

        <View style={styles.dotContainer}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton title="Continuar" onPress={() => router.push('/onboarding/emotion')} />

        <TouchableOpacity
          onPress={handleSkipIntro}
          style={styles.skipButton}
          disabled={skipLoading}
        >
          {skipLoading ? (
            <ActivityIndicator size="small" color={THEME.colors.gradient.blue} />
          ) : (
            <Text style={styles.skipText}>Saltar introducción</Text>
          )}
        </TouchableOpacity>
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
    marginBottom: THEME.spacing.xs,
  },
  titleAccent: {
    ...THEME.typography.h1,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    marginBottom: THEME.spacing.lg,
  },
  description: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 28,
  },
  dotContainer: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xl,
  },
  dot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.stroke[100],
  },
  dotActive: {
    backgroundColor: THEME.colors.gradient.blue,
  },
  footer: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
  skipButton: {
    marginTop: THEME.spacing.sm,
    alignItems: 'center',
    padding: THEME.spacing.sm,
  },
  skipText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  exampleContainer: {
    marginTop: THEME.spacing.xl,
    marginBottom: THEME.spacing.lg,
  },
  exampleCard: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    ...THEME.shadows.soft,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  exampleEmoji: {
    fontSize: 24,
  },
  exampleTitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  exampleSubtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  exampleDivider: {
    height: 1,
    backgroundColor: THEME.colors.stroke[100],
    marginVertical: THEME.spacing.xs,
  },
  exampleResult: {
    ...THEME.typography.body,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  arrowDown: {
    alignItems: 'center',
    marginVertical: THEME.spacing.xs,
  },
});
