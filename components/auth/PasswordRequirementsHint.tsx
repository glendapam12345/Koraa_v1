import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

const REQUIREMENT_KEYS = [
  'password.reqLength',
  'password.reqLetter',
  'password.reqNumber',
  'password.reqSymbolsOptional',
] as const;

export function PasswordRequirementsHint() {
  const { t } = useI18n();

  return (
    <View style={styles.wrap} accessibilityRole="text">
      <Text style={styles.title}>{t('password.requirementsTitle')}</Text>
      {REQUIREMENT_KEYS.map((key) => (
        <Text key={key} style={styles.item}>
          {'• '}
          {t(key)}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginBottom: 4,
  },
  item: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
});
