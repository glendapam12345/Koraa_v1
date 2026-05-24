import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CheckCircle2 } from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useI18n } from '@/contexts/I18nContext';

type FlowStep = 'vaciar' | 'sentir' | 'accionar';

interface FlowIndicatorProps {
  currentStep: FlowStep;
}

export function FlowIndicator({ currentStep }: FlowIndicatorProps) {
  const router = useRouter();
  const { isLoading: subscriptionLoading, isSubscribed } = useSubscription();
  const { t } = useI18n();

  const steps: { id: FlowStep; label: string }[] = [
    { id: 'vaciar', label: t('tabs.tasks') },
    { id: 'sentir', label: t('tabs.feel') },
    { id: 'accionar', label: t('tabs.today') },
  ];

  const getStepStatus = (step: FlowStep) => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    const stepIndex = steps.findIndex((s) => s.id === step);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.caption}>{t('flow.caption')}</Text>
      <View style={styles.container}>
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isLast = index === steps.length - 1;

          return (
            <View key={step.id} style={styles.stepContainer}>
              <View style={styles.stepContent}>
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
              </View>
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
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepContent: {
    alignItems: 'center',
    flex: 1,
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
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontSize: 11,
  },
  stepLabelCurrent: {
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  stepLabelCompleted: {
    color: THEME.colors.text.main,
  },
  connector: {
    width: 20,
    height: 2,
    backgroundColor: THEME.colors.stroke[100],
    marginHorizontal: THEME.spacing.xs,
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
