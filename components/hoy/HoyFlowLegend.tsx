import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type FlowLegendStep = 'tasks' | 'feel' | 'focus';

type HoyFlowLegendProps = {
  currentStep: FlowLegendStep;
};

const STEP_ORDER: FlowLegendStep[] = ['tasks', 'feel', 'focus'];

export function HoyFlowLegend({ currentStep }: HoyFlowLegendProps) {
  const { t } = useI18n();

  const labels: Record<FlowLegendStep, string> = {
    tasks: t('flow.stepTasksShort'),
    feel: t('flow.stepFeelShort'),
    focus: t('flow.stepFocusShort'),
  };

  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel={t('hoy.flowLegendA11y', { step: labels[currentStep] })}
    >
      {STEP_ORDER.map((step, index) => {
        const isCurrent = step === currentStep;
        const isDone = index < currentIndex;
        const isLast = index === STEP_ORDER.length - 1;

        return (
          <View key={step} style={styles.stepGroup}>
            <View style={styles.stepInline}>
              <View
                style={[
                  styles.dot,
                  isDone && styles.dotDone,
                  isCurrent && styles.dotCurrent,
                ]}
              />
              <Text
                style={[
                  styles.label,
                  isDone && styles.labelDone,
                  isCurrent && styles.labelCurrent,
                ]}
                numberOfLines={1}
              >
                {labels[step]}
              </Text>
            </View>
            {!isLast ? <View style={[styles.connector, isDone && styles.connectorDone]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: THEME.spacing.sm,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.pill,
  },
  stepGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
  },
  stepInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 108,
  },
  connector: {
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: THEME.colors.stroke[100],
    marginHorizontal: 2,
  },
  connectorDone: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
    opacity: 0.45,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: THEME.colors.stroke[100],
  },
  dotDone: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  dotCurrent: {
    backgroundColor: THEME.colors.gradient.blue,
  },
  label: {
    ...THEME.typography.meta,
    fontSize: 10,
    color: THEME.colors.text.tertiary,
    flexShrink: 1,
  },
  labelDone: {
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  labelCurrent: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
