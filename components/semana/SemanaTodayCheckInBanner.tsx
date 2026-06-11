import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';

export function SemanaTodayCheckInBanner() {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={() => router.push(CHECK_IN_ROUTE)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t('semana.noCheckInTodayBannerCta')}
      accessibilityHint={t('semanaExtra.noCheckInTodayBannerHint')}
    >
      <View style={styles.iconWrap}>
        <Heart size={18} color={THEME.colors.calm.lavenderDeep} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{t('semana.noCheckInTodayBannerTitle')}</Text>
        <Text style={styles.body}>{t('semana.noCheckInTodayBannerBody')}</Text>
        <Text style={styles.cta}>{t('semana.noCheckInTodayBannerCta')}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderRadius: THEME.borderRadius.card,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    padding: THEME.spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.fill[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  body: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  cta: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    marginTop: 2,
  },
});
