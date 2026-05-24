import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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
import { Check, Crown, Lock, X } from 'lucide-react-native';
import { getPrivacyPolicyUrl, getTermsOfServiceUrl } from '@/constants/legalUrls';
import { THEME } from '@/constants/theme';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useI18n } from '@/contexts/I18nContext';

type PaywallScreenProps = {
  onClose?: () => void;
  onPurchaseCompleted?: () => void;
  onSkip?: () => void;
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

export function PaywallScreen({ onClose, onPurchaseCompleted, onSkip }: PaywallScreenProps) {
  const { t } = useI18n();
  const { currentOffering, checkSubscription, restorePurchases, isLoading: subscriptionLoading } = useSubscription();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const premiumGlow = useRef(new Animated.Value(0.75)).current;

  const packages = useMemo(() => currentOffering?.availablePackages ?? [], [currentOffering?.availablePackages]);
  const primaryPackage = packages[0] ?? null;

  /** Expo Go no ejecuta tu binario con IAP como TestFlight; StoreKit suele no devolver productos aquí. */
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  /** Evita mostrar “planes no cargaron” mientras RevenueCat aún sincroniza tras abrir el paywall. */
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

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(premiumGlow, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(premiumGlow, {
          toValue: 0.75,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [premiumGlow]);

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
            onPress={() => {
              if (onClose) {
                onClose();
                return;
              }
              onSkip?.();
            }}
            accessibilityRole="button"
            accessibilityLabel={t('paywallExtra.a11yClose')}
            accessibilityHint={t('paywallExtra.a11yCloseHint')}
          >
            <X size={18} color={THEME.colors.fill[100]} />
          </TouchableOpacity>
          <View style={styles.heroIconWrap}>
            <Crown size={22} color={THEME.colors.fill[100]} />
          </View>
          <Text style={styles.title}>{t('paywall.title')}</Text>
          <Text style={styles.subtitle}>{t('paywall.subtitle')}</Text>
          <Text style={styles.heroHint}>{t('paywall.heroHint')}</Text>
        </LinearGradient>

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

        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonTitle}>{t('paywall.comparisonTitle')}</Text>
          <View style={styles.comparisonRow}>
            <Check size={15} color={THEME.colors.gradient.blue} />
            <Text style={styles.comparisonFreeText}>{t('paywall.free1')}</Text>
          </View>
          <View style={styles.comparisonRow}>
            <Check size={15} color={THEME.colors.gradient.blue} />
            <Text style={styles.comparisonFreeText}>{t('paywall.free2')}</Text>
          </View>
          <View style={styles.comparisonRow}>
            <Check size={15} color={THEME.colors.gradient.blue} />
            <Text style={styles.comparisonFreeText}>{t('paywall.free3')}</Text>
          </View>

          <View style={styles.premiumLockedDivider} />

          <View style={[styles.comparisonRow, styles.premiumLockedRow]}>
            <View style={styles.premiumLockedLeft}>
              <Lock size={14} color={THEME.colors.text.secondary} />
              <Text style={styles.comparisonLockedText}>{t('paywall.locked1')}</Text>
            </View>
            <Animated.Text style={[styles.premiumBadge, { opacity: premiumGlow }]}>
              {t('paywall.premiumBadge')}
            </Animated.Text>
          </View>
          <View style={[styles.comparisonRow, styles.premiumLockedRow]}>
            <View style={styles.premiumLockedLeft}>
              <Lock size={14} color={THEME.colors.text.secondary} />
              <Text style={styles.comparisonLockedText}>{t('paywall.locked2')}</Text>
            </View>
            <Animated.Text style={[styles.premiumBadge, { opacity: premiumGlow }]}>
              {t('paywall.premiumBadge')}
            </Animated.Text>
          </View>
          <View style={[styles.comparisonRow, styles.premiumLockedRow]}>
            <View style={styles.premiumLockedLeft}>
              <Lock size={14} color={THEME.colors.text.secondary} />
              <Text style={styles.comparisonLockedText}>{t('paywall.locked3')}</Text>
            </View>
            <Animated.Text style={[styles.premiumBadge, { opacity: premiumGlow }]}>
              {t('paywall.premiumBadge')}
            </Animated.Text>
          </View>
        </View>

        {primaryPackage ? (
          <View style={styles.priceHighlightCard}>
            <Text style={styles.priceHighlightLabel}>{t('paywall.currentPrice')}</Text>
            <Text style={styles.priceHighlightValue}>
              {primaryPackage.product.priceString}
              <Text style={styles.priceHighlightPeriod}>{getPeriodLabel(primaryPackage)}</Text>
            </Text>
            <Text style={styles.priceHighlightHint}>{t('paywall.cancelAnytime')}</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => void handlePurchase(primaryPackage)}
              disabled={isPurchasing || isRestoring || isRefreshing || subscriptionLoading}
              style={styles.ctaWrap}
              accessibilityRole="button"
              accessibilityLabel={t('paywallExtra.a11yChoosePlan', { title: primaryPackage.product.title })}
              accessibilityHint={t('paywallExtra.a11yChoosePlanHint')}
              accessibilityState={{ disabled: isPurchasing || isRestoring || isRefreshing || subscriptionLoading }}
            >
              <LinearGradient
                colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cta}
              >
                {isPurchasing ? (
                  <ActivityIndicator color={THEME.colors.onGradient} />
                ) : (
                  <Text style={styles.ctaText}>{t('paywall.continuePremium')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : null}

        {subscriptionLoading && packages.length === 0 ? (
          <View style={styles.loadingPlans}>
            <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
            <Text style={styles.loadingPlansText}>{t('paywallExtra.loadingPlans')}</Text>
          </View>
        ) : packages.length > 0 ? (
          packages.map((pkg) => (
            <View key={pkg.identifier} style={styles.planCard}>
              <Text style={styles.planTitle}>{pkg.product.title}</Text>
              <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
              <Text style={styles.planDescription}>
                {pkg.product.description || t('paywall.defaultPlanDescription')}
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => void handlePurchase(pkg)}
                disabled={isPurchasing || isRestoring || isRefreshing || subscriptionLoading}
                style={styles.ctaWrap}
                accessibilityRole="button"
                accessibilityLabel={t('paywallExtra.a11yChoosePlan', { title: pkg.product.title })}
                accessibilityHint={t('paywallExtra.a11yChoosePlanHint')}
                accessibilityState={{ disabled: isPurchasing || isRestoring || isRefreshing || subscriptionLoading }}
              >
                <LinearGradient
                  colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cta}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color={THEME.colors.onGradient} />
                  ) : (
                    <Text style={styles.ctaText}>{t('paywallExtra.chooseThisPlan')}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t('paywallExtra.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('paywallExtra.emptyBody')}</Text>
            <Text style={styles.fallbackPlansTitle}>{t('paywallExtra.fallbackPlansTitle')}</Text>
            <View style={styles.fallbackPlansWrap}>
              <View style={styles.planCard}>
                <View style={styles.fallbackPlanHeader}>
                  <Text style={styles.planTitle}>{t('paywallExtra.monthlyTitle')}</Text>
                  <View style={styles.fallbackPlanBadge}>
                    <Text style={styles.fallbackPlanBadgeText}>{t('paywallExtra.monthlyBadge')}</Text>
                  </View>
                </View>
                <Text style={styles.planPrice}>{t('paywallExtra.fallbackMonthlyPrice')}</Text>
                <Text style={styles.planDescription}>{t('paywallExtra.monthlyDesc')}</Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => void handleFallbackPlanPress('monthly')}
                  style={styles.ctaWrap}
                  accessibilityRole="button"
                  accessibilityLabel={t('paywallExtra.a11yBuyMonthly')}
                  accessibilityHint={t('paywallExtra.a11yBuyMonthlyHint')}
                >
                  <LinearGradient
                    colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cta}
                  >
                    <Text style={styles.ctaText}>{t('paywallExtra.monthlyCta')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <LinearGradient
                colors={['rgba(74, 144, 226, 0.07)', 'rgba(255, 107, 107, 0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fallbackAnnualCard}
              >
                <Text style={styles.planTitle}>{t('paywallExtra.annualTitle')}</Text>
                <Text style={styles.planPrice}>{t('paywallExtra.fallbackAnnualPrice')}</Text>
                <Text style={styles.planDescription}>{t('paywallExtra.fallbackAnnualBadge')}</Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => void handleFallbackPlanPress('annual')}
                  style={styles.ctaWrap}
                  accessibilityRole="button"
                  accessibilityLabel={t('paywallExtra.a11yBuyAnnual')}
                  accessibilityHint={t('paywallExtra.a11yBuyAnnualHint')}
                >
                  <LinearGradient
                    colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cta}
                  >
                    <Text style={styles.ctaText}>{t('paywallExtra.annualCta')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
            {isExpoGo ? (
              <Text style={styles.emptyHintExpoGo}>{t('paywallExtra.expoGoHint')}</Text>
            ) : null}
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
  planCard: {
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    gap: THEME.spacing.xs,
    ...THEME.shadows.soft,
  },
  priceHighlightCard: {
    backgroundColor: THEME.colors.text.main,
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    gap: THEME.spacing.xs,
    ...THEME.shadows.soft,
  },
  priceHighlightLabel: {
    ...THEME.typography.small,
    color: THEME.colors.onGradientFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  priceHighlightValue: {
    ...THEME.typography.h2,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
  },
  priceHighlightPeriod: {
    ...THEME.typography.body,
    color: THEME.colors.onGradientFaint,
    fontFamily: THEME.fonts.heading.medium,
  },
  priceHighlightHint: {
    ...THEME.typography.small,
    color: THEME.colors.onGradientSubtle,
  },
  comparisonCard: {
    backgroundColor: THEME.colors.fill[100],
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
    gap: THEME.spacing.xs,
  },
  comparisonTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    marginBottom: 2,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  comparisonFreeText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    flex: 1,
  },
  premiumLockedDivider: {
    marginVertical: 2,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.fill[200],
  },
  premiumLockedRow: {
    backgroundColor: THEME.colors.fill[200],
    borderRadius: THEME.borderRadius.standard,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 6,
    opacity: 0.9,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
  },
  premiumLockedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    flex: 1,
  },
  comparisonLockedText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    flex: 1,
  },
  premiumBadge: {
    ...THEME.typography.small,
    color: THEME.colors.gradient.blue,
    fontFamily: THEME.fonts.heading.bold,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
  },
  planTitle: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  planPrice: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  planDescription: {
    ...THEME.typography.small,
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
  ctaText: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
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
  fallbackPlansWrap: {
    gap: THEME.spacing.sm,
  },
  fallbackPlansTitle: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  fallbackPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.xs,
  },
  fallbackPlanBadge: {
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 4,
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
  },
  fallbackPlanBadgeText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
  fallbackAnnualCard: {
    borderRadius: THEME.borderRadius.rounded,
    padding: THEME.spacing.md,
    gap: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    ...THEME.shadows.soft,
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
