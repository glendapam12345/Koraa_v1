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
    tasks: t('tabs.tasks'),
    feel: t('flow.stepCheckInLabel'),
    focus: t('flow.stepTodayShort'),
  };

  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <View style={styles.wrap} accessibilityRole="text">
      <Text style={styles.caption}>{t('hoy.flowLegendCaption')}</Text>
      <View style={styles.row}>
        {STEP_ORDER.map((step, index) => {
          const isCurrent = step === currentStep;
          const isDone = index < currentIndex;
          return (
            <View key={step} style={styles.stepCol}>
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
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
  },
  caption: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: THEME.spacing.xs,
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.stroke[100],
  },
  dotDone: {
    backgroundColor: THEME.colors.calm.lavenderDeep,
  },
  dotCurrent: {
    backgroundColor: THEME.colors.gradient.blue,
    transform: [{ scale: 1.15 }],
  },
  label: {
    ...THEME.typography.meta,
    fontSize: 11,
    color: THEME.colors.text.tertiary,
    textAlign: 'center',
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
