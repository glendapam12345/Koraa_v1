import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { openPaywall } from '@/lib/paywallNavigation';
import { LockedChartPreview } from '@/components/parami/LockedChartPreview';

type ParaMiPatternsLockedPreviewProps = {
  moodTitle: string;
  paywallReturnTo?: string;
};

/** Preview freemium — deja claro que el patrón completo es Premium. */
export function ParaMiPatternsLockedPreview({
  moodTitle,
  paywallReturnTo = '/(tabs)/parami',
}: ParaMiPatternsLockedPreviewProps) {
  const { t } = useI18n();

  return (
    <LinearGradient
      colors={[THEME.colors.calm.lavender, THEME.colors.calm.mist, THEME.colors.calm.card]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.card}
    >
      <View style={styles.premiumPill}>
        <Lock size={12} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.premiumPillText}>{t('parami.periodPremiumBadge')}</Text>
      </View>

      <Text style={styles.title}>{moodTitle}</Text>
      <Text style={styles.body}>{t('parami.patternsLockedBody')}</Text>

      <View style={styles.preview}>
        <LockedChartPreview variant="mood" />
      </View>

      <Text style={styles.freeNote}>{t('parami.patternsLockedFreeNote')}</Text>

      <TouchableOpacity
        style={styles.cta}
        onPress={() => openPaywall(router, paywallReturnTo)}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={t('parami.patternUnlockA11y')}
        accessibilityHint={t('paramiExtra.a11yUnlockHint')}
      >
        <Text style={styles.ctaText}>{t('parami.patternsLockedCta')}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    alignItems: 'center',
  },
  premiumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  premiumPillText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  title: {
    ...THEME.typography.cardTitle,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  body: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
  },
  preview: {
    width: '100%',
    opacity: 0.7,
    marginVertical: THEME.spacing.xs,
  },
  freeNote: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  cta: {
    marginTop: THEME.spacing.xs,
    alignSelf: 'stretch',
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  ctaText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
    textAlign: 'center',
  },
});
