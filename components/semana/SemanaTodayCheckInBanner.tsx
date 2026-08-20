import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart, ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { goToCheckIn } from '@/lib/checkInNavigation';

/** Aviso compacto — una línea, sin bloque grande. */
export function SemanaTodayCheckInBanner() {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={() => goToCheckIn()}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t('semana.noCheckInTodayBannerCta')}
      accessibilityHint={t('semanaExtra.noCheckInTodayBannerHint')}
    >
      <Heart size={14} color={THEME.colors.calm.lavenderDeep} />
      <Text style={styles.text} numberOfLines={2}>
        <Text style={styles.muted}>{t('semana.noCheckInTodayBannerCompact')}</Text>
        <Text style={styles.link}> {t('semana.noCheckInTodayBannerCta')}</Text>
      </Text>
      <ChevronRight size={16} color={THEME.colors.calm.lavenderDeep} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    minHeight: THEME.sizes.touchTarget,
  },
  text: {
    flex: 1,
    ...THEME.typography.caption,
    lineHeight: 18,
  },
  muted: {
    color: THEME.colors.text.secondary,
  },
  link: {
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
