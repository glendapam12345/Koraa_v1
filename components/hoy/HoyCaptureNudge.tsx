import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Mic, Paperclip, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

export function HoyCaptureNudge() {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={() => router.push('/(tabs)/vaciar')}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={t('hoy.captureNudgeA11y')}
    >
      <Text style={styles.placeholder}>{t('hoy.captureNudgePlaceholder')}</Text>
      <View style={styles.footer}>
        <View style={styles.icons}>
          <Mic size={18} color={THEME.colors.text.tertiary} />
          <Paperclip size={18} color={THEME.colors.text.tertiary} />
        </View>
        <View style={styles.cta}>
          <Sparkles size={14} color={THEME.colors.onGradient} />
          <Text style={styles.ctaText}>{t('vaciar.releaseTask')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...THEME.surfaces.panel,
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    padding: THEME.spacing.sm,
    gap: THEME.spacing.sm,
    minHeight: 112,
    justifyContent: 'space-between',
  },
  placeholder: {
    ...THEME.typography.body,
    color: THEME.colors.text.tertiary,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    minHeight: THEME.sizes.touchTarget,
  },
  ctaText: {
    ...THEME.typography.small,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
    lineHeight: 20,
  },
});
