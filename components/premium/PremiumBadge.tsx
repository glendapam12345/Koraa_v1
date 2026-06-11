import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

/** Indicador compacto de suscripción activa (no ocupa media pantalla). */
export function PremiumBadge() {
  const { t } = useI18n();

  return (
    <View
      style={styles.badge}
      accessibilityRole="text"
      accessibilityLabel={t('premiumActive.badgeA11y')}
    >
      <Text style={styles.emoji} accessibilityElementsHidden>
        ✨
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
  },
  emoji: {
    fontSize: 18,
    lineHeight: 22,
  },
});
