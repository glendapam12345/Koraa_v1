import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyLiteBannerProps = {
  onShowAll: () => void;
};

export function HoyLiteBanner({ onShowAll }: HoyLiteBannerProps) {
  const { t } = useI18n();

  return (
    <View style={styles.hoyLiteBanner}>
      <Text style={styles.hoyLiteBannerText}>{t('hoy.hoyLiteBanner')}</Text>
      <TouchableOpacity
        onPress={onShowAll}
        style={styles.hoyLiteBannerBtn}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={t('hoyExtra.showAllA11y')}
        accessibilityHint={t('hoyExtra.showAllHint')}
      >
        <Text style={styles.hoyLiteBannerBtnText}>{t('hoy.showAllNow')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  hoyLiteBanner: {
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  hoyLiteBannerText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    marginBottom: THEME.spacing.sm,
  },
  hoyLiteBannerBtn: {
    alignSelf: 'flex-start',
    paddingVertical: THEME.spacing.xs,
  },
  hoyLiteBannerBtnText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
});
