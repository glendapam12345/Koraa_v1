import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

export function FlowGuideCard() {
  const { t } = useI18n();
  return (
    <View style={styles.flowGuideCard}>
      <Text style={styles.flowGuideCardTitle}>{t('flowGuide.title')}</Text>
      <View style={styles.flowSteps}>
        <View style={styles.flowStep}>
          <Text style={styles.flowStepNumber}>1</Text>
          <Text style={styles.flowStepText}>{t('flowGuide.step1Title')}</Text>
          <Text style={styles.flowStepDesc}>{t('flowGuide.step1Body')}</Text>
        </View>
        <Text style={styles.flowArrowText}>→</Text>
        <View style={styles.flowStep}>
          <Text style={styles.flowStepNumber}>2</Text>
          <Text style={styles.flowStepText}>{t('flowGuide.step2Title')}</Text>
          <Text style={styles.flowStepDesc}>{t('flowGuide.step2Body')}</Text>
        </View>
        <Text style={styles.flowArrowText}>→</Text>
        <View style={styles.flowStep}>
          <Text style={styles.flowStepNumber}>3</Text>
          <Text style={styles.flowStepText}>{t('flowGuide.step3Title')}</Text>
          <Text style={styles.flowStepDesc}>{t('flowGuide.step3Body')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flowGuideCard: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    ...THEME.shadows.soft,
  },
  flowGuideCardTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
    fontFamily: THEME.fonts.heading.bold,
  },
  flowSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  flowStep: {
    alignItems: 'center',
    flex: 1,
  },
  flowStepNumber: {
    ...THEME.typography.h2,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: THEME.spacing.xs,
  },
  flowStepText: {
    ...THEME.typography.body,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    marginBottom: 4,
  },
  flowStepDesc: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  flowArrowText: {
    ...THEME.typography.h2,
    color: THEME.colors.text.secondary,
    fontSize: 20,
  },
});
