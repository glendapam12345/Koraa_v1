import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type PreviewVariant = 'low' | 'high';

function ExampleCard({
  variant,
  feel,
  result,
  steps,
}: {
  variant: PreviewVariant;
  feel: string;
  result: string;
  steps: string[];
}) {
  const emoji = variant === 'low' ? '😔' : '✨';
  const colors =
    variant === 'low'
      ? ([...THEME.colors.parami.energyCard] as const)
      : ([...THEME.colors.parami.moodCard] as const);

  return (
    <LinearGradient
      colors={[...colors]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.95, y: 1 }}
      style={[styles.card, THEME.shadows.soft]}
    >
      <View style={styles.feelRow}>
        <Text style={styles.emoji} accessibilityElementsHidden>
          {emoji}
        </Text>
        <View style={styles.feelCopy}>
          <Text style={styles.feel}>{feel}</Text>
          <Text style={styles.result}>{result}</Text>
        </View>
      </View>
      <View style={styles.steps}>
        {steps.map((step) => (
          <View key={step} style={styles.stepRow}>
            <View style={styles.dot} />
            <Text style={styles.step}>{step}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

/** Muestra el aha de Koraa: el día se adapta a cómo te sientes. */
export function OnboardingValuePreview() {
  const { t } = useI18n();

  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={`${t('onboarding.welcome.exampleExhausted')}. ${t('onboarding.welcome.exampleResultLow')}. ${t('onboarding.welcome.exampleMotivated')}. ${t('onboarding.welcome.exampleResultHigh')}`}
    >
      <Text style={styles.kicker}>{t('onboarding.welcome.previewTitle')}</Text>
      <ExampleCard
        variant="low"
        feel={t('onboarding.welcome.exampleExhausted')}
        result={t('onboarding.welcome.exampleResultLow')}
        steps={[
          t('onboarding.welcome.exampleLowStep1'),
          t('onboarding.welcome.exampleLowStep2'),
        ]}
      />
      <Text style={styles.or}>{t('onboarding.welcome.exampleOr')}</Text>
      <ExampleCard
        variant="high"
        feel={t('onboarding.welcome.exampleMotivated')}
        result={t('onboarding.welcome.exampleResultHigh')}
        steps={[
          t('onboarding.welcome.exampleHighStep1'),
          t('onboarding.welcome.exampleHighStep2'),
          t('onboarding.welcome.exampleHighStep3'),
        ]}
      />
      <Text style={styles.promise}>{t('onboarding.welcome.promise')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.sm,
    width: '100%',
  },
  kicker: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  card: {
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  feelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 28,
    marginTop: 1,
  },
  feelCopy: {
    flex: 1,
    gap: 2,
  },
  feel: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  result: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    lineHeight: 18,
  },
  steps: {
    gap: THEME.spacing.xs,
    paddingLeft: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.calm.lavender,
  },
  step: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    flex: 1,
  },
  or: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.accent.italic,
    textAlign: 'center',
    marginVertical: 2,
  },
  promise: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.accent.italic,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: THEME.spacing.xs,
  },
});
