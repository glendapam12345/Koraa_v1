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
import { Check, X } from 'lucide-react-native';
import { getPrivacyPolicyUrl, getTermsOfServiceUrl } from '@/constants/legalUrls';
import { THEME } from '@/constants/theme';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatPackagePrice, formatSubscriptionPrice, packageUsesNonMxnCurrency } from '@/lib/formatSubscriptionPrice';
import {
  formatAnnualMonthlyEquivalent,
  getAnnualSavingsPercent,
  getPlanPeriodKey,
  isPlanPackage,
  shouldClaimIntendedAnnualDiscount,
  sortPackagesForDisplay,
} from '@/lib/paywallPlans';
import {
  PREMIUM_ANNUAL_DISCOUNT_PERCENT,
  PREMIUM_ANNUAL_MXN,
  PREMIUM_MONTHLY_MXN,
} from '@/lib/premiumPricing';
import { canProcessInAppPurchases, isExpoGoClient } from '@/lib/subscriptionEnvironment';
import { PaywallComparisonCard } from '@/components/premium/PaywallComparisonCard';
import { PaywallContextBanner } from '@/components/premium/PaywallContextBanner';
import { PaywallPlanCard } from '@/components/premium/PaywallPlanCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';

type PaywallScreenProps = {
  onClose?: () => void;
  onPurchaseCompleted?: () => void;
  onSkip?: () => void;
  /** Tras completar onboarding: mensaje más claro de que Premium es opcional. */
  context?: 'onboarding' | 'default';
};

export function PaywallScreen({ onClose, onPurchaseCompleted, onSkip, context = 'default' }: PaywallScreenProps) {
  const { t, locale } = useI18n();
  const {
    currentOffering,
    checkSubscription,
    restorePurchases,
    isLoading: subscriptionLoading,
    isSubscribed,
    isDevPremiumSim,
  } = useSubscription();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [benefitsOpen, setBenefitsOpen] = useState(false);

  const packages = useMemo(() => currentOffering?.availablePackages ?? [], [currentOffering?.availablePackages]);
  const sortedPackages = useMemo(() => sortPackagesForDisplay(packages), [packages]);
  const monthlyPackage = useMemo(() => sortedPackages.find((pkg) => isPlanPackage(pkg, 'monthly')), [sortedPackages]);
  const annualPackage = useMemo(() => sortedPackages.find((pkg) => isPlanPackage(pkg, 'annual')), [sortedPackages]);
  const annualSavingsPercent = useMemo(
    () => getAnnualSavingsPercent(monthlyPackage, annualPackage),
    [monthlyPackage, annualPackage],
  );
  const showForeignCurrencyHint = useMemo(
    () => sortedPackages.some(packageUsesNonMxnCurrency),
    [sortedPackages],
  );
  const mexicoMonthlyLabel = formatSubscriptionPrice(PREMIUM_MONTHLY_MXN, 'MXN', locale);
  const mexicoAnnualLabel = formatSubscriptionPrice(PREMIUM_ANNUAL_MXN, 'MXN', locale);
  const showMxnHint = useMemo(
    () => sortedPackages.some((pkg) => pkg.product.currencyCode?.toUpperCase() === 'MXN'),
    [sortedPackages],
  );

  const isExpoGo = isExpoGoClient();
  const purchasesEnabled = canProcessInAppPurchases();
  const isOnboardingContext = context === 'onboarding';
  const showDevSimBanner = __DEV__ && !isSubscribed && !isDevPremiumSim;
  const plansDisabled = isPurchasing || isRestoring || isRefreshing || subscriptionLoading;

  const alertPurchaseBlocked = () => {
    Alert.alert(t('paywallExtra.expoGoPurchaseBlockedTitle'), t('paywallExtra.expoGoPurchaseBlockedBody'));
  };

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

  const handleContinueFree = () => {
    if (onClose) {
      onClose();
      return;
    }
    onSkip?.();
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    if (!purchasesEnabled) {
      alertPurchaseBlocked();
      return;
    }
    setIsPurchasing(true);
    try {
      const Purchases = (await import('react-native-purchases')).default;
      await Purchases.purchasePackage(pkg);
      const subscribed = await checkSubscription();
      if (subscribed) {
        Alert.alert(t('paywall.purchaseSuccessTitle'), t('paywall.purchaseSuccessBody'));
        onPurchaseCompleted?.();
        return;
      }
      Alert.alert(t('paywall.purchaseActivatingTitle'), t('paywall.purchaseActivatingBody'));
    } catch (e: unknown) {
      const err = e as { code?: string; userCancelled?: boolean };
      if (
        err.userCancelled === true ||
        String(err.code ?? '').includes('CANCELLED')
      ) {
        return;
      }
      Alert.alert(t('paywall.purchaseError'), t('common.retry'));
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (!purchasesEnabled) {
      Alert.alert(t('paywallExtra.expoGoRestoreBlockedTitle'), t('paywallExtra.expoGoRestoreBlockedBody'));
      return;
    }
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
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('paywall.openLinkError'), t('paywall.openLinkErrorBody'));
    }
  };

  const getPeriodLabel = (pkg: PurchasesPackage | null) => {
    if (!pkg) return '';
    const period = getPlanPeriodKey(pkg);
    if (period === 'year') return t('paywall.perYear');
    if (period === 'month') return t('paywall.perMonth');
    if (period === 'week') return t('paywall.perWeek');
    return '';
  };

  const getPlanTitle = (pkg: PurchasesPackage) =>
    isPlanPackage(pkg, 'annual') ? t('paywallExtra.annualTitle') : t('paywallExtra.monthlyTitle');

  const getPlanDescription = (pkg: PurchasesPackage) => {
    if (!isPlanPackage(pkg, 'annual')) return t('paywallExtra.monthlyDesc');
    if (shouldClaimIntendedAnnualDiscount(annualSavingsPercent)) {
      return t('paywallExtra.annualDescDiscount', { percent: PREMIUM_ANNUAL_DISCOUNT_PERCENT });
    }
    return t('paywallExtra.annualDesc');
  };

  const getPlanCta = (pkg: PurchasesPackage) =>
    isPlanPackage(pkg, 'annual') ? t('paywallExtra.annualCta') : t('paywallExtra.monthlyCta');

  const handleFallbackPlanPress = async (plan: 'monthly' | 'annual') => {
    if (!purchasesEnabled) {
      alertPurchaseBlocked();
      return;
    }
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

  const renderLivePlanCard = (pkg: PurchasesPackage) => {
    const isAnnual = isPlanPackage(pkg, 'annual');
    const period = getPeriodLabel(pkg);
    const priceLabel = formatPackagePrice(pkg, locale, period);
    const savingsLabel =
      isAnnual && annualSavingsPercent
        ? t('paywallExtra.annualSavingsBadge', { percent: annualSavingsPercent })
        : undefined;
    const monthlyEquivalentLabel =
      isAnnual && purchasesEnabled
        ? t('paywallExtra.annualMonthlyEquivalent', {
            price: formatAnnualMonthlyEquivalent(pkg, locale),
          })
        : undefined;

    return (
      <PaywallPlanCard
        key={pkg.identifier}
        title={getPlanTitle(pkg)}
        priceLabel={priceLabel}
        description={getPlanDescription(pkg)}
        ctaLabel={getPlanCta(pkg)}
        recommended={isAnnual}
        planBadge={!isAnnual ? t('paywallExtra.monthlyBadge') : undefined}
        savingsLabel={savingsLabel}
        monthlyEquivalentLabel={monthlyEquivalentLabel}
        previewPrice={!purchasesEnabled}
        purchasesEnabled={purchasesEnabled}
        disabled={plansDisabled}
        loading={isPurchasing}
        onPress={() => void handlePurchase(pkg)}
      />
    );
  };

  const renderFallbackPlanCard = (plan: 'monthly' | 'annual') => {
    const isAnnual = plan === 'annual';
    const priceLabel = isAnnual
      ? t('paywallExtra.fallbackAnnualPrice', { price: mexicoAnnualLabel })
      : t('paywallExtra.fallbackMonthlyPrice', { price: mexicoMonthlyLabel });

    return (
      <PaywallPlanCard
        key={`fallback-${plan}`}
        title={isAnnual ? t('paywallExtra.annualTitle') : t('paywallExtra.monthlyTitle')}
        priceLabel={priceLabel}
        description={
          isAnnual
            ? t('paywallExtra.annualDescDiscount', { percent: PREMIUM_ANNUAL_DISCOUNT_PERCENT })
            : t('paywallExtra.monthlyDesc')
        }
        ctaLabel={isAnnual ? t('paywallExtra.annualCta') : t('paywallExtra.monthlyCta')}
        recommended={isAnnual}
        planBadge={!isAnnual ? t('paywallExtra.monthlyBadge') : undefined}
        savingsLabel={isAnnual ? t('paywallExtra.fallbackAnnualSavings') : undefined}
        monthlyEquivalentLabel={
          isAnnual
            ? t('paywallExtra.annualMonthlyEquivalent', {
                price: formatSubscriptionPrice(PREMIUM_ANNUAL_MXN / 12, 'MXN', locale),
              })
            : undefined
        }
        previewPrice={!purchasesEnabled}
        purchasesEnabled={purchasesEnabled}
        disabled={plansDisabled}
        onPress={() => void handleFallbackPlanPress(plan)}
      />
    );
  };

  const heroSubtitle = isSubscribed
    ? isDevPremiumSim
      ? t('paywall.subscribedDevSimSubtitle')
      : t('paywall.subscribedSubtitle')
    : isOnboardingContext
      ? t('paywallExtra.onboardingSubtitle')
      : t('paywall.subtitle');

  const heroHint = isSubscribed
    ? isDevPremiumSim
      ? t('paywall.subscribedDevSimHint')
      : t('paywall.subscribedHint')
    : t('paywall.heroHint');

  const skipLabel = isOnboardingContext ? t('paywallExtra.exploreFreeCta') : t('paywallExtra.continueFreePrimary');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, isSubscribed && styles.heroSubscribed]}>
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
            <X size={18} color={THEME.colors.calm.lavenderDeep} />
          </TouchableOpacity>

          {isSubscribed ? (
            <View style={styles.heroIconWrap}>
              <Check size={20} color={THEME.colors.calm.lavenderDeep} />
            </View>
          ) : null}

          <Text style={styles.title}>{isSubscribed ? t('paywall.subscribedTitle') : t('paywall.title')}</Text>
          <Text style={styles.subtitle}>{heroSubtitle}</Text>
          <Text style={styles.heroHint}>{heroHint}</Text>
        </View>

        {isOnboardingContext && !isSubscribed ? <PaywallContextBanner variant="onboarding" /> : null}
        {isExpoGo && !isSubscribed ? <PaywallContextBanner variant="expoGo" /> : null}
        {showDevSimBanner ? <PaywallContextBanner variant="devSim" /> : null}

        {!isSubscribed ? (
          <>
            <View style={styles.secondaryLinksRow}>
              <TouchableOpacity
                onPress={handleContinueFree}
                activeOpacity={0.85}
                disabled={plansDisabled}
                style={styles.secondaryLink}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel={skipLabel}
                accessibilityHint={
                  isOnboardingContext
                    ? t('paywallExtra.exploreFreeHint')
                    : t('paywallExtra.a11yContinueFreeHint')
                }
                accessibilityState={{ disabled: plansDisabled }}
              >
                <Text style={styles.secondaryLinkText}>{skipLabel}</Text>
              </TouchableOpacity>
              <Text style={styles.secondaryLinkSeparator} accessibilityElementsHidden>
                ·
              </Text>
              <TouchableOpacity
                style={styles.secondaryLink}
                onPress={() => setBenefitsOpen((open) => !open)}
                activeOpacity={0.85}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                accessibilityRole="button"
                accessibilityState={{ expanded: benefitsOpen }}
                accessibilityLabel={
                  benefitsOpen ? t('paywall.benefitsToggleHide') : t('paywall.benefitsToggleShow')
                }
              >
                <Text style={styles.secondaryLinkText}>
                  {benefitsOpen ? t('paywall.benefitsToggleHide') : t('paywall.benefitsToggleShow')}
                </Text>
              </TouchableOpacity>
            </View>
            {benefitsOpen ? <PaywallComparisonCard isSubscribed={false} /> : null}
          </>
        ) : (
          <PaywallComparisonCard isSubscribed />
        )}

        {isSubscribed ? (
          <CalmPrimaryButton
            label={t('paywall.subscribedContinue')}
            onPress={handleContinueFree}
            accessibilityLabel={t('paywall.subscribedContinueA11y')}
          />
        ) : (
          <>
            <Text style={styles.sectionTitle}>{t('paywallExtra.choosePlanTitle')}</Text>
            {showMxnHint ? <Text style={styles.priceHint}>{t('paywallExtra.pricesInMxn')}</Text> : null}
            {showForeignCurrencyHint ? (
              <Text style={styles.priceHintWarning}>
                {t('paywallExtra.foreignCurrencyHint', {
                  monthly: mexicoMonthlyLabel,
                  annual: mexicoAnnualLabel,
                })}
              </Text>
            ) : null}

            {subscriptionLoading && packages.length === 0 ? (
              <View style={styles.loadingPlans}>
                <ActivityIndicator size="large" color={THEME.colors.calm.lavenderDeep} />
                <Text style={styles.loadingPlansText}>{t('paywallExtra.loadingPlans')}</Text>
              </View>
            ) : sortedPackages.length > 0 ? (
              <View style={styles.plansStack}>{sortedPackages.map((pkg) => renderLivePlanCard(pkg))}</View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>
                  {isExpoGo ? t('paywallExtra.expoGoEmptyTitle') : t('paywallExtra.emptyTitle')}
                </Text>
                <Text style={styles.emptyText}>
                  {isExpoGo ? t('paywallExtra.expoGoEmptyBody') : t('paywallExtra.emptyBody')}
                </Text>
                <View style={styles.plansStack}>
                  {renderFallbackPlanCard('annual')}
                  {renderFallbackPlanCard('monthly')}
                </View>
                {!isExpoGo ? (
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
                ) : null}
              </View>
            )}

            <Text style={styles.cancelNote}>{t('paywall.cancelAnytime')}</Text>
          </>
        )}

        <View style={styles.footerActions}>
          <View style={styles.footerLinksRow}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => void handleRestore()}
              disabled={plansDisabled}
              accessibilityRole="button"
              accessibilityLabel={t('paywallExtra.a11yRestore')}
              accessibilityHint={t('paywallExtra.a11yRestoreHint')}
              accessibilityState={{ disabled: plansDisabled }}
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
    backgroundColor: THEME.colors.calm.background,
  },
  content: {
    paddingHorizontal: THEME.layout.screenPaddingX,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  hero: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  heroSubscribed: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    marginBottom: 2,
  },
  heroIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.calm.lavender,
    marginBottom: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
    marginTop: 2,
  },
  heroHint: {
    ...THEME.typography.small,
    color: THEME.colors.text.tertiary,
    marginTop: 4,
    lineHeight: 18,
  },
  secondaryLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 2,
  },
  secondaryLink: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  secondaryLinkText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  secondaryLinkSeparator: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
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
  cancelNote: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingPlans: {
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
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
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  emptyTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  emptyText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
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
    borderColor: THEME.colors.calm.border,
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
