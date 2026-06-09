import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, Crown } from 'lucide-react-native';
import { router } from 'expo-router';
import { openPaywall } from '@/lib/paywallNavigation';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type PremiumTeaserCardProps = {
  title: string;
  body: string;
  ctaLabel?: string;
  onPress?: () => void;
  /** Texto opcional sobre qué incluye el plan gratis (p. ej. límites en Consejos). */
  freeLimitNote?: string;
  /** Ruta a la que volver tras cerrar paywall. */
  paywallReturnTo?: string;
};

export function PremiumTeaserCard({
  title,
  body,
  ctaLabel,
  onPress,
  freeLimitNote,
  paywallReturnTo,
}: PremiumTeaserCardProps) {
  const { t } = useI18n();
  const resolvedCta = ctaLabel ?? t('premiumTeaser.cta');

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    openPaywall(router, paywallReturnTo);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Crown size={14} color={THEME.colors.gradient.blue} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.optionalLabel}>{t('premiumTeaser.optional')}</Text>
      </View>
      {freeLimitNote ? <Text style={styles.freeLimitNote}>{freeLimitNote}</Text> : null}
      <Text style={styles.body}>{body}</Text>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={styles.cta}
        accessibilityRole="button"
        accessibilityLabel={resolvedCta}
        accessibilityHint={t('premiumTeaser.a11yHint')}
      >
        <Text style={styles.ctaText}>{resolvedCta}</Text>
        <ChevronRight size={16} color={THEME.colors.gradient.blue} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: THEME.spacing.lg,
    ...THEME.surfaces.elevated,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    flex: 1,
  },
  optionalLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
  },
  freeLimitNote: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
    marginBottom: 4,
    lineHeight: 18,
  },
  body: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  cta: {
    marginTop: THEME.spacing.xs,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 36,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  ctaText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
});
