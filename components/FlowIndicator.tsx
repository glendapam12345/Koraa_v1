import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CheckCircle2 } from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';
type FlowStep = 'vaciar' | 'sentir' | 'accionar';

interface FlowIndicatorProps {
  currentStep: FlowStep;
}

const STEP_ROUTES: Record<FlowStep, string> = {
  sentir: '/(tabs)',
  vaciar: '/(tabs)/vaciar',
  accionar: '/(tabs)',
};

export type { FlowStep };

export function FlowIndicator({ currentStep }: FlowIndicatorProps) {
  const router = useRouter();
  const { isLoading: subscriptionLoading, isSubscribed } = useSubscription();
  const { t } = useI18n();

  const steps: {
    id: FlowStep;
    label: string;
    hintKey: TranslationKey;
    a11yKey: TranslationKey;
  }[] = [
    { id: 'sentir', label: t('hoy.inicio.stepFeel'), hintKey: 'flow.stepFeelHint', a11yKey: 'flow.stepFeelA11y' },
    { id: 'vaciar', label: t('hoy.inicio.stepUnload'), hintKey: 'flow.stepTasksHint', a11yKey: 'flow.stepTasksA11y' },
    { id: 'accionar', label: t('tabs.today'), hintKey: 'flow.stepTodayHint', a11yKey: 'flow.stepTodayA11y' },
  ];

  const getStepStatus = (step: FlowStep) => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    const stepIndex = steps.findIndex((s) => s.id === step);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const openStep = (stepId: FlowStep) => {
    router.push(STEP_ROUTES[stepId] as '/(tabs)/vaciar');
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.caption}>{t('flow.caption')}</Text>
      <Text style={styles.captionSub}>{t('flow.captionSub')}</Text>
      <View style={styles.container}>
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isLast = index === steps.length - 1;

          return (
            <View key={step.id} style={styles.stepContainer}>
              <TouchableOpacity
                style={styles.stepContent}
                onPress={() => openStep(step.id)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t(step.a11yKey)}
                accessibilityState={{ selected: status === 'current' }}
              >
                {status === 'completed' ? (
                  <View style={styles.stepIconCompleted}>
                    <CheckCircle2 size={20} color={THEME.colors.fill[100]} />
                  </View>
                ) : status === 'current' ? (
                  <View style={[styles.stepIcon, styles.stepIconCurrent]}>
                    <View style={styles.stepCurrentDot} />
                  </View>
                ) : (
                  <View style={styles.stepIcon} />
                )}
                <Text
                  style={[
                    styles.stepLabel,
                    status === 'current' && styles.stepLabelCurrent,
                    status === 'completed' && styles.stepLabelCompleted,
                  ]}
                >
                  {step.label}
                </Text>
                <Text style={styles.stepHint}>{t(step.hintKey)}</Text>
              </TouchableOpacity>
              {!isLast && (
                <View
                  style={[styles.connector, status === 'completed' && styles.connectorCompleted]}
                />
              )}
            </View>
          );
        })}
      </View>

      {!subscriptionLoading && !isSubscribed ? (
        <TouchableOpacity
          onPress={() => router.push('/paywall')}
          activeOpacity={0.75}
          style={styles.premiumHintWrap}
          accessibilityRole="button"
          accessibilityLabel={t('flow.managePremium')}
          accessibilityHint={t('flowExtra.a11yPremiumHint')}
        >
          <Text style={styles.premiumHintText}>
            {t('flow.premiumHint')}{' '}
            <Text style={styles.premiumHintLink}>{t('flow.managePremium')}</Text>
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: THEME.spacing.md,
  },
  caption: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    textAlign: 'center',
    marginBottom: 4,
  },
  captionSub: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
    lineHeight: 18,
    paddingHorizontal: THEME.spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  stepContent: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 2,
    borderColor: THEME.colors.stroke[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.xs,
  },
  stepIconCurrent: {
    backgroundColor: THEME.colors.gradient.blue,
    borderColor: THEME.colors.gradient.blue,
  },
  stepCurrentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.fill[100],
  },
  stepIconCompleted: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.gradient.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.xs,
  },
  stepLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  stepLabelCurrent: {
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  stepLabelCompleted: {
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  stepHint: {
    ...THEME.typography.meta,
    color: THEME.colors.text.metaOnFill,
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 2,
  },
  connector: {
    width: 16,
    height: 2,
    backgroundColor: THEME.colors.stroke[100],
    marginHorizontal: 2,
    marginTop: 15,
  },
  connectorCompleted: {
    backgroundColor: THEME.colors.gradient.blue,
  },
  premiumHintWrap: {
    marginTop: THEME.spacing.sm,
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.sm,
  },
  premiumHintText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  premiumHintLink: {
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
});
