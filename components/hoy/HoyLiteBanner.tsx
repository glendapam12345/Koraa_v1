import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type StepState = 'pending' | 'active' | 'done';

type HoyLiteBannerProps = {
  hasCheckIn: boolean;
  hasTasks: boolean;
  /** Al menos un paso sugerido completado hoy. */
  hasCompletedStep?: boolean;
  /** Usuario expandió apoyo / resto del día en día 1. */
  expanded: boolean;
};

function stepState(done: boolean, active: boolean): StepState {
  if (done) return 'done';
  if (active) return 'active';
  return 'pending';
}

/** Día 1 en Hoy: orientación suave con mini-ruta de 3 pasos. */
export function HoyLiteBanner({
  hasCheckIn,
  hasTasks,
  hasCompletedStep = false,
  expanded,
}: HoyLiteBannerProps) {
  const { t } = useI18n();

  const captureDone = hasTasks;
  const feelDone = hasCheckIn;
  const captureActive = !captureDone && !feelDone;
  const feelActive = captureDone && !feelDone;
  const stepDone = hasCompletedStep || expanded;
  const stepActive = feelDone && !stepDone;

  const steps = [
    {
      key: 'capture',
      label: t('hoy.dayOneStepCapture'),
      state: stepState(captureDone, captureActive),
    },
    {
      key: 'feel',
      label: t('hoy.dayOneStepFeel'),
      state: stepState(feelDone, feelActive),
    },
    {
      key: 'one-step',
      label: t('hoy.dayOneStepOne'),
      state: stepState(stepDone, stepActive),
    },
  ] as const;

  const bodyKey = expanded
    ? 'hoy.hoyLiteBannerExpanded'
    : hasCheckIn
      ? 'hoy.hoyLiteBannerAfterCheckIn'
      : hasTasks
        ? 'hoy.hoyLiteBannerWithTasks'
        : 'hoy.hoyLiteBanner';

  return (
    <View style={styles.banner} accessibilityRole="summary">
      <Text style={styles.eyebrow}>{t('hoy.dayOneEyebrow')}</Text>
      <Text style={styles.body}>{t(bodyKey)}</Text>
      {!expanded ? (
        <View style={styles.stepsRow} accessibilityRole="list">
          {steps.map((step) => (
            <View
              key={step.key}
              style={[
                styles.stepPill,
                step.state === 'active' && styles.stepPillActive,
                step.state === 'done' && styles.stepPillDone,
              ]}
              accessibilityRole="text"
              accessibilityLabel={`${step.label}${
                step.state === 'done' ? `, ${t('hoy.dayOneStepDoneA11y')}` : ''
              }`}
            >
              {step.state === 'done' ? (
                <Check size={12} color={THEME.colors.calm.lavenderDeep} />
              ) : (
                <View
                  style={[
                    styles.stepDot,
                    step.state === 'active' && styles.stepDotActive,
                  ]}
                />
              )}
              <Text
                style={[
                  styles.stepLabel,
                  step.state === 'active' && styles.stepLabelActive,
                  step.state === 'done' && styles.stepLabelDone,
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    gap: THEME.spacing.sm,
  },
  eyebrow: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  stepsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
  },
  stepPillActive: {
    borderColor: THEME.colors.calm.lavenderDeep,
    backgroundColor: THEME.colors.calm.lavender,
  },
  stepPillDone: {
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.fill[100],
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.text.secondary,
    opacity: 0.4,
  },
  stepDotActive: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
    opacity: 1,
  },
  stepLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  stepLabelActive: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  stepLabelDone: {
    color: THEME.colors.text.secondary,
  },
});
