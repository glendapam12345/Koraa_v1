import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { THEME } from '@/constants/theme';
import { Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';

export function FlowGuideCard() {
  return (
    <>
      <View style={styles.flowGuideCard}>
        <Text style={styles.flowGuideCardTitle}>Tu flujo de trabajo</Text>
        <View style={styles.flowStepsContainer}>
          <View style={styles.flowStep}>
            <View style={[styles.flowStepNumber, styles.flowStepNumberActive]}>
              <Text style={[styles.flowStepNumberText, styles.flowStepNumberTextActive]}>1</Text>
            </View>
            <Text style={styles.flowStepLabel}>Vaciar</Text>
            <Text style={styles.flowStepDescription}>Agrega tus tareas</Text>
          </View>
          <View style={styles.flowArrow}>
            <Text style={styles.flowArrowText}>→</Text>
          </View>
          <View style={styles.flowStep}>
            <View style={styles.flowStepNumber}>
              <Text style={styles.flowStepNumberText}>2</Text>
            </View>
            <Text style={styles.flowStepLabel}>Sentir</Text>
            <Text style={styles.flowStepDescription}>Registra cómo te sientes</Text>
          </View>
          <View style={styles.flowArrow}>
            <Text style={styles.flowArrowText}>→</Text>
          </View>
          <View style={styles.flowStep}>
            <View style={styles.flowStepNumber}>
              <Text style={styles.flowStepNumberText}>3</Text>
            </View>
            <Text style={styles.flowStepLabel}>Accionar</Text>
            <Text style={styles.flowStepDescription}>Tus tareas priorizadas</Text>
          </View>
        </View>
      </View>

      {/* Botón principal: ¿Cómo te sientes hoy? */}
      <TouchableOpacity
        style={styles.mainRegisterButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/(tabs)/sentir');
        }}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="¿Cómo te sientes hoy?"
        accessibilityHint="Abre la pantalla para registrar cómo te sientes y organizar tu día"
      >
        <LinearGradient
          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mainRegisterButtonGradient}
        >
          <View style={styles.mainRegisterIcon}>
            <Sparkles size={64} color={THEME.colors.fill[100]} />
          </View>
          <Text style={styles.mainRegisterText}>
            ¿Cómo te sientes hoy?
          </Text>
          <Text style={styles.mainRegisterSubtext}>
            Toca para registrar y organizar tu día
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  flowGuideCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    marginTop: THEME.spacing.sm,
    ...THEME.shadows.soft,
  },
  flowGuideCardTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
    fontFamily: THEME.fonts.heading.bold,
  },
  flowStepsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  flowStep: {
    flex: 1,
    alignItems: 'center',
    minWidth: 80,
  },
  flowStepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 2,
    borderColor: THEME.colors.stroke[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.xs,
  },
  flowStepNumberActive: {
    backgroundColor: THEME.colors.gradient.blue,
    borderColor: THEME.colors.gradient.blue,
  },
  flowStepNumberText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 16,
    color: THEME.colors.text.secondary,
  },
  flowStepNumberTextActive: {
    color: THEME.colors.fill[100],
  },
  flowStepLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    fontSize: 13,
    marginBottom: THEME.spacing.xs / 2,
    textAlign: 'center',
  },
  flowStepDescription: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  flowArrow: {
    paddingHorizontal: THEME.spacing.xs,
    paddingTop: THEME.spacing.xs * 2,
  },
  flowArrowText: {
    ...THEME.typography.h2,
    color: THEME.colors.text.secondary,
    fontSize: 20,
  },
  mainRegisterButton: {
    borderRadius: THEME.borderRadius.rounded,
    marginBottom: THEME.spacing.lg,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  mainRegisterButtonGradient: {
    padding: THEME.spacing.xl * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainRegisterIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  mainRegisterText: {
    ...THEME.typography.h1,
    color: THEME.colors.fill[100],
    textAlign: 'center',
    marginBottom: THEME.spacing.xs,
    fontFamily: THEME.fonts.heading.bold,
  },
  mainRegisterSubtext: {
    ...THEME.typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
});
