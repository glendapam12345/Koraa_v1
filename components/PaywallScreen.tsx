import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { LinearGradient } from 'expo-linear-gradient';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Check, Crown, X } from 'lucide-react-native';
import { getPrivacyPolicyUrl, getTermsOfServiceUrl } from '@/constants/legalUrls';
import { THEME } from '@/constants/theme';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatPackagePrice, packageUsesNonMxnCurrency } from '@/lib/formatSubscriptionPrice';

type PaywallScreenProps = {
  onClose?: () => void;
  onPurchaseCompleted?: () => void;
  onSkip?: () => void;
  /** Tras completar onboarding: mensaje más claro de que Premium es opcional. */
  context?: 'onboarding' | 'default';
};

function isPlanPackage(pkg: PurchasesPackage, plan: 'monthly' | 'annual') {
  const packageType = String(pkg.packageType).toLowerCase();
  const identifier = pkg.identifier.toLowerCase();
  const productId = pkg.product.identifier.toLowerCase();
  const haystack = `${packageType} ${identifier} ${productId}`;
  if (plan === 'monthly') {
    return haystack.includes('month') || haystack.includes('monthly') || haystack.includes('mensual');
  }
  return haystack.includes('annual') || haystack.includes('year') || haystack.includes('anual');
}

function sortPackagesForDisplay(packages: PurchasesPackage[]) {
  const annual = packages.find((pkg) => isPlanPackage(pkg, 'annual'));
  const monthly = packages.find((pkg) => isPlanPackage(pkg, 'monthly'));
  const rest = packages.filter((pkg) => pkg !== annual && pkg !== monthly);
  return [annual, monthly, ...rest].filter((pkg): pkg is PurchasesPackage => Boolean(pkg));
}

export function PaywallScreen({ onClose, onPurchaseCompleted, onSkip, context = 'default' }: PaywallScreenProps) {
  const { t, locale } = useI18n();
  const { currentOffering, checkSubscription, restorePurchases, isLoading: subscriptionLoading } = useSubscription();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const packages = useMemo(() => currentOffering?.availablePackages ?? [], [currentOffering?.availablePackages]);
  const sortedPackages = useMemo(() => sortPackagesForDisplay(packages), [packages]);
  const showForeignCurrencyHint = useMemo(
    () => locale === 'es' && sortedPackages.some(packageUsesNonMxnCurrency),
    [locale, sortedPackages],
  );
  const showMxnHint = useMemo(
    () => sortedPackages.some((pkg) => pkg.product.currencyCode?.toUpperCase() === 'MXN'),
    [sortedPackages],
  );

  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  const isOnboardingContext = context === 'onboarding';

  useEffect(() => {
    void checkSubscription();
  }, [checkSubscription]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await checkSubscription();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setIsPurchasing(true);
    try {
      const Purchases = (await import('react-native-purchases')).default;
      await Purchases.purchasePackage(pkg);
      await checkSubscription();
      onPurchaseCompleted?.();
    } catch {
      Alert.alert(t('paywall.purchaseError'), t('common.retry'));
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleContinueFree = () => {
    if (onClose) {
      onClose();
      return;
    }
    onSkip?.();
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        Alert.alert(t('paywall.restoredTitle'), t('paywall.restoredBody'));
        onPurchaseCompleted?.();
      } else {
        Alert.alert(t('paywall.noRestoreTitle'), result.error ?? t('paywall.noRestoreTitle'));
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const openLegalUrl = async (kind: 'terms' | 'privacy') => {
    const url = kind === 'terms' ? getTermsOfServiceUrl() : getPrivacyPolicyUrl();
    if (!url) {
      const label = kind === 'terms' ? t('paywall.terms') : t('paywall.privacy');
      Alert.alert(t('paywall.linkUnavailable', { label }), t('paywall.linkUnavailableBody'));
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('paywall.openLinkError'), t('paywall.openLinkErrorBody'));
    }
  };

  const getPeriodLabel = (pkg: PurchasesPackage | null) => {
    if (!pkg) return '';
    const id = `${pkg.identifier} ${pkg.packageType}`.toLowerCase();
    if (id.includes('annual') || id.includes('year') || id.includes('anual')) return t('paywall.perYear');
    if (id.includes('month') || id.includes('monthly') || id.includes('mensual')) return t('paywall.perMonth');
    if (id.includes('week') || id.includes('weekly')) return t('paywall.perWeek');
    return '';
  };

  const getPlanTitle = (pkg: PurchasesPackage) =>
    isPlanPackage(pkg, 'annual') ? t('paywallExtra.annualTitle') : t('paywallExtra.monthlyTitle');

  const getPlanDescription = (pkg: PurchasesPackage) =>
    isPlanPackage(pkg, 'annual') ? t('paywallExtra.fallbackAnnualBadge') : t('paywallExtra.monthlyDesc');

  const getPlanCta = (pkg: PurchasesPackage) =>
    isPlanPackage(pkg, 'annual') ? t('paywallExtra.annualCta') : t('paywallExtra.monthlyCta');

  const handleFallbackPlanPress = async (plan: 'monthly' | 'annual') => {
    const planLabel = plan === 'monthly' ? t('paywall.planMonthlyLabel') : t('paywall.planAnnualLabel');
    setIsRefreshing(true);
    try {
      const Purchases = (await import('react-native-purchases')).default;
      const offerings = await Purchases.getOfferings();
      const availablePackages = offerings.current?.availablePackages ?? [];
      const planPackage = availablePackages.find((pkg) => isPlanPackage(pkg, plan));

      if (planPackage) {
        await handlePurchase(planPackage);
        return;
      }

      Alert.alert(t('paywall.planPreparing', { plan: planLabel }), t('paywall.planPreparingBody'));
    } catch {
      Alert.alert(t('paywall.planOpenError', { plan: planLabel }), t('common.retry'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderPlanCard = (pkg: PurchasesPackage) => {
    const isAnnual = isPlanPackage(pkg, 'annual');
    const period = getPeriodLabel(pkg);
    const priceLabel = formatPackagePrice(pkg, locale, period);
    const disabled = isPurchasing || isRestoring || isRefreshing || subscriptionLoading;

    return (
      <View key={pkg.identifier} style={[styles.planCard, isAnnual && styles.planCardRecommended]}>
        {isAnnual ? (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedBadgeText}>{t('paywallExtra.annualRecommended')}</Text>
          </View>
        ) : null}
        <Text style={styles.planTitle}>{getPlanTitle(pkg)}</Text>
        <Text style={styles.planPrice}>{priceLabel}</Text>
        <Text style={styles.planDescription}>{getPlanDescription(pkg)}</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => void handlePurchase(pkg)}
          disabled={disabled}
          style={styles.ctaWrap}
          accessibilityRole="button"
          accessibilityLabel={t('paywallExtra.a11yChoosePlan', { title: getPlanTitle(pkg) })}
          accessibilityHint={t('paywallExtra.a11yChoosePlanHint')}
          accessibilityState={{ disabled }}
        >
          <LinearGradient
            colors={
              isAnnual
                ? [THEME.colors.gradient.blue, THEME.colors.gradient.pink]
                : [THEME.colors.fill[100], THEME.colors.fill[100]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.cta, !isAnnual && styles.ctaOutline]}
          >
            {isPurchasing ? (
              <ActivityIndicator color={isAnnual ? THEME.colors.onGradient : THEME.colors.gradient.blue} />
            ) : (
              <Text style={[styles.ctaText, !isAnnual && styles.ctaTextOutline]}>{getPlanCta(pkg)}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFallbackPlanCard = (plan: 'monthly' | 'annual') => {
    const isAnnual = plan === 'annual';
    const priceLabel = isAnnual ? t('paywallExtra.fallbackAnnualPrice') : t('paywallExtra.fallbackMonthlyPrice');
    const title = isAnnual ? t('paywallExtra.annualTitle') : t('paywallExtra.monthlyTitle');
    const description = isAnnual ? t('paywallExtra.fallbackAnnualBadge') : t('paywallExtra.monthlyDesc');
    const cta = isAnnual ? t('paywallExtra.annualCta') : t('paywallExtra.monthlyCta');

    return (
      <View key={`fallback-${plan}`} style={[styles.planCard, isAnnual && styles.planCardRecommended]}>
        {isAnnual ? (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedBadgeText}>{t('paywallExtra.annualRecommended')}</Text>
          </View>
        ) : null}
        <Text style={styles.planTitle}>{title}</Text>
        <Text style={styles.planPrice}>{priceLabel}</Text>
        <Text style={styles.planDescription}>{description}</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => void handleFallbackPlanPress(plan)}
          disabled={isPurchasing || isRestoring || isRefreshing}
          style={styles.ctaWrap}
          accessibilityRole="button"
          accessibilityLabel={t('paywallExtra.a11yChoosePlan', { title })}
          accessibilityHint={t('paywallExtra.a11yChoosePlanHint')}
        >
          <LinearGradient
            colors={
              isAnnual
                ? [THEME.colors.gradient.blue, THEME.colors.gradient.pink]
                : [THEME.colors.fill[100], THEME.colors.fill[100]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.cta, !isAnnual && styles.ctaOutline]}
          >
            <Text style={[styles.ctaText, !isAnnual && styles.ctaTextOutline]}>{cta}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.closeButton}
            onPress={handleContinueFree}
            accessibilityRole="button"
            accessibilityLabel={t('paywallExtra.a11yClose')}
            accessibilityHint={
              isOnboardingContext ? t('paywallExtra.a11yCloseOnboardingHint') : t('paywallExtra.a11yCloseHint')
            }
          >
            <X size={18} color={THEME.colors.fill[100]} />
          </TouchableOpacity>
          <View style={styles.heroIconWrap}>
            <Crown size={22} color={THEME.colors.fill[100]} />
          </View>
          <Text style={styles.title}>{t('paywall.title')}</Text>
          <Text style={styles.subtitle}>
            {isOnboardingContext ? t('paywallExtra.onboardingSubtitle') : t('paywall.subtitle')}
          </Text>
          <Text style={styles.heroHint}>{t('paywall.heroHint')}</Text>
        </LinearGradient>

        {isOnboardingContext ? (
          <TouchableOpacity
            onPress={handleContinueFree}
            activeOpacity={0.85}
            disabled={isPurchasing || isRestoring || isRefreshing || subscriptionLoading}
            style={styles.exploreFreeButton}
            accessibilityRole="button"
            accessibilityLabel={t('paywallExtra.exploreFreeCta')}
            accessibilityHint={t('paywallExtra.exploreFreeHint')}
            accessibilityState={{
              disabled: isPurchasing || isRestoring || isRefreshing || subscriptionLoading,
            }}
          >
            <Text style={styles.exploreFreeButtonText}>{t('paywallExtra.exploreFreeCta')}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.benefitsCard}>
          <View style={styles.benefitRow}>
            <Check size={16} color={THEME.colors.gradient.blue} />
            <Text style={styles.benefitText}>{t('paywall.benefit1')}</Text>
          </View>
          <View style={styles.benefitRow}>
            <Check size={16} color={THEME.colors.gradient.blue} />
            <Text style={styles.benefitText}>{t('paywall.benefit2')}</Text>
          </View>
          <View style={styles.benefitRow}>
            <Check size={16} color={THEME.colors.gradient.blue} />
            <Text style={styles.benefitText}>{t('paywall.benefit3')}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('paywallExtra.choosePlanTitle')}</Text>
        {showMxnHint ? <Text style={styles.priceHint}>{t('paywallExtra.pricesInMxn')}</Text> : null}
        {showForeignCurrencyHint ? (
          <Text style={styles.priceHintWarning}>{t('paywallExtra.foreignCurrencyHint')}</Text>
        ) : null}

        {subscriptionLoading && packages.length === 0 ? (
          <View style={styles.loadingPlans}>
            <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
            <Text style={styles.loadingPlansText}>{t('paywallExtra.loadingPlans')}</Text>
          </View>
        ) : sortedPackages.length > 0 ? (
          <View style={styles.plansStack}>{sortedPackages.map((pkg) => renderPlanCard(pkg))}</View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t('paywallExtra.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('paywallExtra.emptyBody')}</Text>
            <View style={styles.plansStack}>
              {renderFallbackPlanCard('annual')}
              {renderFallbackPlanCard('monthly')}
            </View>
            {isExpoGo ? <Text style={styles.emptyHintExpoGo}>{t('paywallExtra.expoGoHint')}</Text> : null}
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.75}
              disabled={isRefreshing}
              onPress={() => void handleRefresh()}
              accessibilityRole="button"
              accessibilityLabel={t('paywallExtra.a11yRefresh')}
              accessibilityHint={t('paywallExtra.a11yRefreshHint')}
              accessibilityState={{ disabled: isRefreshing }}
            >
              <Text style={styles.secondaryButtonText}>
                {isRefreshing ? t('paywall.refreshing') : t('paywall.refreshPlans')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.cancelNote}>{t('paywall.cancelAnytime')}</Text>

        {(onClose || onSkip) && !subscriptionLoading ? (
          <TouchableOpacity
            onPress={handleContinueFree}
            activeOpacity={0.75}
            disabled={isPurchasing || isRestoring || isRefreshing}
            style={styles.dismissLinkWrap}
            accessibilityRole="button"
            accessibilityLabel={t('paywallExtra.a11yContinueFree')}
            accessibilityHint={t('paywallExtra.a11yContinueFreeHint')}
            accessibilityState={{ disabled: isPurchasing || isRestoring || isRefreshing }}
          >
            <Text style={styles.dismissLinkText}>{t('paywall.continueFree')}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.footerActions}>
          <View style={styles.footerLinksRow}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => void handleRestore()}
              disabled={isPurchasing || isRestoring || isRefreshing || subscriptionLoading}
              accessibilityRole="button"
              accessibilityLabel={t('paywallExtra.a11yRestore')}
              accessibilityHint={t('paywallExtra.a11yRestoreHint')}
              accessibilityState={{ disabled: isPurchasing || isRestoring || isRefreshing || subscriptionLoading }}
            >
              <Text style={styles.footerLinkText}>
                {isRestoring ? t('paywall.restoring') : t('paywall.restore')}
              </Text>
            </TouchableOpacity>
            <Text style={styles.footerLinkSeparator}>·</Text>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => void openLegalUrl('terms')}
              accessibilityRole="button"
              accessibilityLabel={t('paywallExtra.a11yTerms')}
              accessibilityHint={t('paywallExtra.a11yTermsHint')}
            >
              <Text style={styles.footerLinkText}>{t('paywall.terms')}</Text>
            </TouchableOpacity>
            <Text style={styles.footerLinkSeparator}>·</Text>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => void openLegalUrl('privacy')}
              accessibilityRole="button"
              accessibilityLabel={t('paywallExtra.a11yPrivacy')}
              accessibilityHint={t('paywallExtra.a11yPrivacyHint')}
            >
              <Text style={styles.footerLinkText}>{t('paywall.privacy')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.fill[100],
  },
  content: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  hero: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    ...THEME.shadows.soft,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: THEME.sizes.touchTarget,
    height: THEME.sizes.touchTarget,
    borderRadius: THEME.sizes.touchTarget / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceOverlay.medium,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceOverlay.borderStrong,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceOverlay.medium,
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.fill[100],
    fontFamily: THEME.fonts.heading.bold,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.fill[100],
    opacity: 0.95,
  },
  heroHint: {
    ...THEME.typography.small,
    color: THEME.colors.fill[100],
    opacity: 0.9,
    marginTop: THEME.spacing.xs,
  },
  exploreFreeButton: {
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1.5,
    borderColor: THEME.colors.gradient.blue,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.fill[100],
  },
  exploreFreeButtonText: {
    ...THEME.typography.caption,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  benefitsCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
    gap: THEME.spacing.xs,
    ...THEME.shadows.soft,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.xs,
  },
  benefitText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    flex: 1,
  },
  sectionTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  priceHint: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    marginTop: -THEME.spacing.xs,
  },
  priceHintWarning: {
    ...THEME.typography.meta,
    color: THEME.colors.gradient.blue,
    marginTop: -THEME.spacing.xs,
  },
  plansStack: {
    gap: THEME.spacing.sm,
  },
  planCard: {
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    gap: THEME.spacing.xs,
    ...THEME.shadows.soft,
  },
  planCardRecommended: {
    borderColor: THEME.colors.tint.blue.border,
    borderWidth: 1.5,
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  recommendedBadgeText: {
    ...THEME.typography.meta,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
  },
  planTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  planPrice: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  planDescription: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
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
  },
  ctaOutline: {
    borderWidth: 1.5,
    borderColor: THEME.colors.gradient.blue,
  },
  ctaText: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  ctaTextOutline: {
    color: THEME.colors.gradient.blue,
  },
  cancelNote: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  loadingPlans: {
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
    backgroundColor: THEME.colors.fill[100],
    padding: THEME.spacing.xl,
    alignItems: 'center',
    gap: THEME.spacing.sm,
    minHeight: 120,
    justifyContent: 'center',
  },
  loadingPlansText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  emptyState: {
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
    backgroundColor: THEME.colors.fill[100],
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  dismissLinkWrap: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
  },
  dismissLinkText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
    textDecorationLine: 'underline',
  },
  emptyTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  emptyText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  emptyHintExpoGo: {
    ...THEME.typography.small,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.medium,
    marginTop: THEME.spacing.xs,
    lineHeight: 20,
  },
  footerActions: {
    marginTop: THEME.spacing.xs,
  },
  footerLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
  },
  footerLinkText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    textDecorationLine: 'underline',
    fontFamily: THEME.fonts.heading.medium,
  },
  footerLinkSeparator: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
  },
  secondaryButton: {
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  secondaryButtonText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
});
