import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type PaywallPlanCardProps = {
  title: string;
  priceLabel: string;
  description: string;
  ctaLabel: string;
  recommended?: boolean;
  planBadge?: string;
  savingsLabel?: string;
  monthlyEquivalentLabel?: string;
  previewPrice?: boolean;
  purchasesEnabled: boolean;
  disabled: boolean;
  loading?: boolean;
  onPress: () => void;
};

export function PaywallPlanCard({
  title,
  priceLabel,
  description,
  ctaLabel,
  recommended = false,
  planBadge,
  savingsLabel,
  monthlyEquivalentLabel,
  previewPrice = false,
  purchasesEnabled,
  disabled,
  loading = false,
  onPress,
}: PaywallPlanCardProps) {
  const { t } = useI18n();
  const ctaText = purchasesEnabled ? ctaLabel : t('paywallExtra.expoGoCtaDisabled');

  return (
    <View style={[styles.card, recommended && styles.cardRecommended]}>
      <View style={styles.badgeRow}>
        {recommended ? (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedBadgeText}>{t('paywallExtra.annualRecommended')}</Text>
          </View>
        ) : planBadge ? (
          <View style={styles.flexBadge}>
            <Text style={styles.flexBadgeText}>{planBadge}</Text>
          </View>
        ) : (
          <View style={styles.badgeSpacer} />
        )}
        {savingsLabel ? (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsBadgeText}>{savingsLabel}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.price}>{priceLabel}</Text>
      {monthlyEquivalentLabel ? (
        <Text style={styles.monthlyEquivalent}>{monthlyEquivalentLabel}</Text>
      ) : null}
      {previewPrice ? (
        <Text style={styles.previewPriceLabel}>{t('paywallExtra.expoGoPreviewPriceLabel')}</Text>
      ) : null}
      <Text style={styles.description}>{description}</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled}
        style={[styles.ctaWrap, !purchasesEnabled && styles.ctaPreview]}
        accessibilityRole="button"
        accessibilityLabel={t('paywallExtra.a11yChoosePlan', { title })}
        accessibilityHint={
          purchasesEnabled
            ? t('paywallExtra.a11yChoosePlanHint')
            : t('paywallExtra.a11yChoosePlanHintPreview')
        }
        accessibilityState={{ disabled }}
      >
        {purchasesEnabled ? (
          <LinearGradient
            colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            {loading ? (
              <ActivityIndicator color={THEME.colors.onGradient} />
            ) : (
              <Text style={styles.ctaText}>{ctaText}</Text>
            )}
          </LinearGradient>
        ) : (
          <Text style={styles.ctaPreviewText}>{ctaText}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    gap: THEME.spacing.xs,
    ...THEME.shadows.soft,
  },
  cardRecommended: {
    borderColor: THEME.colors.tint.blue.border,
    borderWidth: 1.5,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.xs,
    minHeight: 24,
  },
  badgeSpacer: {
    flex: 1,
  },
  recommendedBadge: {
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  recommendedBadgeText: {
    ...THEME.typography.meta,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  flexBadge: {
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    backgroundColor: THEME.colors.calm.mist,
  },
  flexBadgeText: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  savingsBadge: {
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    backgroundColor: THEME.colors.calm.lavender,
  },
  savingsBadgeText: {
    ...THEME.typography.meta,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  title: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  price: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  monthlyEquivalent: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    marginTop: -4,
  },
  description: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  previewPriceLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
  },
  ctaWrap: {
    marginTop: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
  },
  cta: {
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  ctaText: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  ctaPreview: {
    minHeight: THEME.sizes.touchTarget,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.mist,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  ctaPreviewText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
  },
});
