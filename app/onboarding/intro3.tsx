import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';
import { Sparkles, ArrowRight } from 'lucide-react-native';

export default function Intro3Screen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Sparkles size={32} color={THEME.colors.gradient.pink} />
          </View>
        </View>

        <Text style={styles.title}>Obtén claridad</Text>
        <Text style={styles.titleAccent}>automática</Text>

        <Text style={styles.description}>
          Kora prioriza por ti. Solo enfócate en lo que realmente importa hoy.
        </Text>

        {/* Flujo visual completo */}
        <View style={styles.flowContainer}>
          <View style={styles.flowStep}>
            <View style={styles.flowStepNumber}>
              <Text style={styles.flowStepNumberText}>1</Text>
            </View>
            <View style={styles.flowStepContent}>
              <Text style={styles.flowStepTitle}>Vaciar</Text>
              <Text style={styles.flowStepDesc}>Escribe tus tareas</Text>
            </View>
          </View>

          <View style={styles.flowArrow}>
            <ArrowRight size={20} color={THEME.colors.text.secondary} />
          </View>

          <View style={styles.flowStep}>
            <View style={styles.flowStepNumber}>
              <Text style={styles.flowStepNumberText}>2</Text>
            </View>
            <View style={styles.flowStepContent}>
              <Text style={styles.flowStepTitle}>Sentir</Text>
              <Text style={styles.flowStepDesc}>Di cómo te sientes</Text>
            </View>
          </View>

          <View style={styles.flowArrow}>
            <ArrowRight size={20} color={THEME.colors.text.secondary} />
          </View>

          <View style={styles.flowStep}>
            <View style={styles.flowStepNumber}>
              <Text style={styles.flowStepNumberText}>3</Text>
            </View>
            <View style={styles.flowStepContent}>
              <Text style={styles.flowStepTitle}>Hoy</Text>
              <Text style={styles.flowStepDesc}>Ve tus prioridades</Text>
            </View>
          </View>
        </View>

        {/* Resultado visual */}
        <View style={styles.resultCard}>
          <LinearGradient
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.resultGradient}
          >
            <Text style={styles.resultTitle}>✨ Resultado</Text>
            <Text style={styles.resultText}>
              Tus tareas priorizadas automáticamente según cómo te sientes hoy
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.dotContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title="Continuar →"
          onPress={() => router.push('/onboarding/how-it-works')}
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
  flowContainer: {
    marginTop: THEME.spacing.xl,
    marginBottom: THEME.spacing.lg,
  },
  flowStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  flowStepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.md,
  },
  flowStepNumberText: {
    ...THEME.typography.body,
    color: '#FFFFFF',
    fontFamily: THEME.fonts.heading.bold,
  },
  flowStepContent: {
    flex: 1,
  },
  flowStepTitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: 2,
  },
  flowStepDesc: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
  flowArrow: {
    alignItems: 'center',
    marginLeft: 18,
    marginBottom: THEME.spacing.md,
  },
  resultCard: {
    borderRadius: THEME.borderRadius.rounded,
    overflow: 'hidden',
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  resultGradient: {
    padding: THEME.spacing.lg,
  },
  resultTitle: {
    ...THEME.typography.h3,
    color: '#FFFFFF',
    marginBottom: THEME.spacing.xs,
  },
  resultText: {
    ...THEME.typography.body,
    color: '#FFFFFF',
    lineHeight: 24,
  },
});
