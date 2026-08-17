import { Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

/** Recordatorio suave en la tarde — un paso pequeño basta. */
export function HoyAfternoonNudge() {
  const { t } = useI18n();

  return <Text style={styles.line}>{t('hoy.afternoonNudgeLine')}</Text>;
}

const styles = StyleSheet.create({
  line: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.accent.italic,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    marginTop: 0,
  },
});
