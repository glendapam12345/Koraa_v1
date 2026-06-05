import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useI18n } from '@/contexts/I18nContext';
import { THEME } from '@/constants/theme';

type OnboardingProgressDotsProps = {
  total: number;
  activeIndex: number;
  style?: StyleProp<ViewStyle>;
};

export function OnboardingProgressDots({ total, activeIndex, style }: OnboardingProgressDotsProps) {
  const { t } = useI18n();

  return (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={t('onboardingA11y.progressStep', {
        current: activeIndex + 1,
        total,
      })}
    >
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[styles.dot, index === activeIndex && styles.dotActive]}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    justifyContent: 'center',
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
});
