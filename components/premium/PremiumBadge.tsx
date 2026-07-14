import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type PremiumBadgeProps = {
  compact?: boolean;
};

/** Indicador claro de suscripción activa. */
export function PremiumBadge({ compact = false }: PremiumBadgeProps) {
  const { t } = useI18n();

  return (
    <View
      style={[styles.badge, compact && styles.badgeCompact]}
      accessibilityRole="text"
      accessibilityLabel={t('premiumActive.badgeA11y')}
    >
      <Text style={[styles.text, compact && styles.textCompact]}>{t('premiumActive.shortLabel')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.lavender,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: 32,
  },
  badgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    minHeight: 22,
  },
  text: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  textCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
});
