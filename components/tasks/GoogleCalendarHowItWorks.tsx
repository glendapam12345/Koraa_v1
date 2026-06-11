import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

export function GoogleCalendarHowItWorks() {
  const { t } = useI18n();

  return (
    <View style={styles.wrap} accessibilityRole="text">
      <Text style={styles.title}>{t('googleCalendar.howItWorksTitle')}</Text>
      <Text style={styles.step}>{t('googleCalendar.step1')}</Text>
      <Text style={styles.step}>{t('googleCalendar.step2')}</Text>
      <Text style={styles.step}>{t('googleCalendar.step3')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  title: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    marginBottom: 2,
  },
  step: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
});
