import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { Wind } from 'lucide-react-native';

export default function Intro2Screen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Wind size={32} color={THEME.colors.gradient.blue} />
          </View>
        </View>

        <Text style={styles.title}>Vacía tu mente en</Text>
        <Text style={styles.titleAccent}>un respiro</Text>

        <Text style={styles.description}>
          Sin categorías. Sin etiquetas. Sin estructura.{'\n'}
          Solo escribe lo que necesitas soltar.
        </Text>

        <View style={styles.dotContainer}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title="Continuar →"
          onPress={() => router.push('/onboarding/intro3')}
        />

        <TouchableOpacity
          onPress={() => router.push('/auth')}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Saltar introducción</Text>
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
});
