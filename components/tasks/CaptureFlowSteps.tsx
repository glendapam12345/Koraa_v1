import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

export type CaptureFlowStepId = 'dump' | 'review' | 'calibrate' | 'plan' | 'done';

type CaptureFlowStepsProps = {
  current: CaptureFlowStepId;
};

const STEPS: CaptureFlowStepId[] = ['dump', 'review', 'calibrate', 'plan', 'done'];

export function CaptureFlowSteps({ current }: CaptureFlowStepsProps) {
  const { t } = useI18n();
  const currentIdx = STEPS.indexOf(current);

  const labels: Record<CaptureFlowStepId, string> = {
    dump: t('vaciar.flowStepDump'),
    review: t('vaciar.flowStepReview'),
    calibrate: t('vnext.flowStepCalibrate'),
    plan: t('frentes.flowStepPlan'),
    done: t('vaciar.flowStepDone'),
  };

  return (
    <Animated.View entering={FadeIn.duration(240)} style={styles.wrap}>
      {STEPS.map((step, index) => {
        const active = index === currentIdx;
        const done = index < currentIdx;
        const isLast = index === STEPS.length - 1;
        return (
          <View key={step} style={styles.stepRow}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.dot,
                  active && styles.dotActive,
                  done && styles.dotDone,
                ]}
              />
              <Text
                style={[
                  styles.label,
                  active && styles.labelActive,
                  done && styles.labelDone,
                ]}
                numberOfLines={1}
              >
                {labels[step]}
              </Text>
            </View>
            {!isLast ? (
              <View style={[styles.connector, done && styles.connectorDone]} />
            ) : null}
          </View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    paddingVertical: THEME.spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: 72,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.calm.border,
  },
  dotActive: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
    transform: [{ scale: 1.25 }],
  },
  dotDone: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  label: {
    ...THEME.typography.micro,
    color: THEME.colors.text.tertiary,
    textAlign: 'center',
  },
  labelActive: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  labelDone: {
    color: THEME.colors.text.secondary,
  },
  connector: {
    height: 2,
    flex: 0.4,
    backgroundColor: THEME.colors.calm.border,
    marginBottom: 14,
  },
  connectorDone: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
});
