import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
import type { EllieMood } from '@/components/onboarding/OnboardingEllieCoach';

type FlowStep = {
  n: number;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  mood: EllieMood;
};

const MOOD_IMAGES: Record<EllieMood, number> = {
  default: require('@/assets/images/ellie-mascot.png'),
  breathing: require('@/assets/images/ellie-mood-breathing.png'),
  sleepy: require('@/assets/images/ellie-mood-sleepy.png'),
  happy: require('@/assets/images/ellie-mood-happy.png'),
  grateful: require('@/assets/images/ellie-mood-grateful.png'),
};

const STEPS: FlowStep[] = [
  {
    n: 1,
    titleKey: 'onboarding.flow.step1Title',
    bodyKey: 'onboarding.flow.step1Body',
    mood: 'happy',
  },
  {
    n: 2,
    titleKey: 'onboarding.flow.step2Title',
    bodyKey: 'onboarding.flow.step2Body',
    mood: 'breathing',
  },
  {
    n: 3,
    titleKey: 'onboarding.flow.step3Title',
    bodyKey: 'onboarding.flow.step3Body',
    mood: 'grateful',
  },
  {
    n: 4,
    titleKey: 'onboarding.flow.step4Title',
    bodyKey: 'onboarding.flow.step4Body',
    mood: 'default',
  },
];

type OnboardingFlowStepsProps = {
  /** Si el padre ya muestra título + flechas, no repetir kicker/lead. */
  hideIntro?: boolean;
};

/**
 * Flujo Koraa en 4 pasos — Ellie moods + números claros.
 */
export function OnboardingFlowSteps({ hideIntro = false }: OnboardingFlowStepsProps) {
  const { t } = useI18n();

  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={t('onboarding.flow.a11y')}
    >
      {hideIntro ? null : (
        <>
          <Text style={styles.kicker}>{t('onboarding.flow.kicker')}</Text>
          <Text style={styles.lead}>{t('onboarding.flow.lead')}</Text>
        </>
      )}

      <View style={styles.list}>
        {STEPS.map((step, index) => (
          <View key={step.n} style={styles.row}>
            <View style={styles.rail}>
              <LinearGradient
                colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.badge}
              >
                <Text style={styles.badgeNum}>{step.n}</Text>
              </LinearGradient>
              {index < STEPS.length - 1 ? <View style={styles.connector} /> : null}
            </View>

            <View style={[styles.card, THEME.shadows.soft]}>
              <Image
                source={MOOD_IMAGES[step.mood]}
                style={styles.mood}
                resizeMode="contain"
                accessibilityElementsHidden
              />
              <View style={styles.copy}>
                <Text style={styles.title}>{t(step.titleKey)}</Text>
                <Text style={styles.body}>{t(step.bodyKey)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>{t('onboarding.flow.footer')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: THEME.spacing.sm,
  },
  kicker: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  lead: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: THEME.spacing.xs,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: THEME.spacing.sm,
  },
  rail: {
    width: 40,
    alignItems: 'center',
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNum: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
  },
  connector: {
    flex: 1,
    width: 3,
    minHeight: 12,
    marginVertical: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.calm.lavender,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    minHeight: 72,
  },
  mood: {
    width: 44,
    height: 44,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  body: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  footer: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.calm.lavenderDeep,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: THEME.spacing.xs,
  },
});
