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

type PaywallScreenProps = {
  onClose?: () => void;
  onPurchaseCompleted?: () => void;
  onSkip?: () => void;
};

const FALLBACK_MONTHLY_PRICE = '$49 MXN / mes';
const FALLBACK_ANNUAL_PRICE = '$411.60 MXN / año';
const FALLBACK_ANNUAL_BADGE = '12 meses con 30% de descuento';

export function PaywallScreen({ onClose, onPurchaseCompleted, onSkip }: PaywallScreenProps) {
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
      Alert.alert('No se pudo completar la compra', 'Inténtalo de nuevo.');
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
        Alert.alert('Compras restauradas', 'Tu Premium ya está activo.');
        onPurchaseCompleted?.();
      } else {
        Alert.alert('Sin compras para restaurar', result.error ?? 'No encontramos compras anteriores.');
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const openLegalUrl = async (kind: 'terms' | 'privacy') => {
    const url = kind === 'terms' ? getTermsOfServiceUrl() : getPrivacyPolicyUrl();
    if (!url) {
      const label = kind === 'terms' ? 'Términos' : 'Privacidad';
      Alert.alert(`${label} no disponible`, 'Configura este enlace en el entorno de producción.');
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('No se pudo abrir el enlace', 'Inténtalo de nuevo en un momento.');
    }
  };

  const getPeriodLabel = (pkg: PurchasesPackage | null) => {
    if (!pkg) return '';
    const id = `${pkg.identifier} ${pkg.packageType}`.toLowerCase();
    if (id.includes('annual') || id.includes('year') || id.includes('anual')) return '/ año';
    if (id.includes('month') || id.includes('monthly') || id.includes('mensual')) return '/ mes';
    if (id.includes('week') || id.includes('weekly')) return '/ semana';
    return '';
  };

  const handleFallbackPlanPress = (plan: 'monthly' | 'annual') => {
    const planLabel = plan === 'monthly' ? 'mensual' : 'anual';
    Alert.alert(
      `Plan ${planLabel} en preparación`,
      'Estamos conectando este plan con App Store. Toca "Actualizar planes" para cargar precios en vivo.',
    );
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
            accessibilityLabel="Cerrar pantalla de premium"
            accessibilityHint="Vuelve a la app sin cambiar tu plan"
          >
            <X size={18} color={THEME.colors.fill[100]} />
          </TouchableOpacity>
          <View style={styles.heroIconWrap}>
            <Crown size={22} color={THEME.colors.fill[100]} />
          </View>
          <Text style={styles.title}>Koraa Premium</Text>
          <Text style={styles.subtitle}>Convierte tu bienestar en un sistema sostenible, no en una lista infinita.</Text>
          <Text style={styles.heroHint}>Tu plan gratis sigue activo, Premium solo desbloquea extras.</Text>
        </LinearGradient>

        <View style={styles.benefitsCard}>
          <View style={styles.benefitRow}>
            <Check size={16} color={THEME.colors.gradient.blue} />
            <Text style={styles.benefitText}>Historial semanal completo para ver progreso real.</Text>
          </View>
          <View style={styles.benefitRow}>
            <Check size={16} color={THEME.colors.gradient.blue} />
            <Text style={styles.benefitText}>Consejos personalizados según cómo te sientes.</Text>
          </View>
          <View style={styles.benefitRow}>
            <Check size={16} color={THEME.colors.gradient.blue} />
            <Text style={styles.benefitText}>Plan semanal más claro para decidir qué hacer primero.</Text>
          </View>
        </View>

        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonTitle}>En tu plan gratis hoy</Text>
          <View style={styles.comparisonRow}>
            <Check size={15} color={THEME.colors.gradient.blue} />
            <Text style={styles.comparisonFreeText}>Check-in diario emocional</Text>
          </View>
          <View style={styles.comparisonRow}>
            <Check size={15} color={THEME.colors.gradient.blue} />
            <Text style={styles.comparisonFreeText}>Captura y gestión base de tareas</Text>
          </View>
          <View style={styles.comparisonRow}>
            <Check size={15} color={THEME.colors.gradient.blue} />
            <Text style={styles.comparisonFreeText}>Vista semanal limitada</Text>
          </View>

          <View style={styles.premiumLockedDivider} />

          <View style={[styles.comparisonRow, styles.premiumLockedRow]}>
            <View style={styles.premiumLockedLeft}>
              <Lock size={14} color={THEME.colors.text.secondary} />
              <Text style={styles.comparisonLockedText}>Semana completa (7 días)</Text>
            </View>
            <Animated.Text style={[styles.premiumBadge, { opacity: premiumGlow }]}>Premium</Animated.Text>
          </View>
          <View style={[styles.comparisonRow, styles.premiumLockedRow]}>
            <View style={styles.premiumLockedLeft}>
              <Lock size={14} color={THEME.colors.text.secondary} />
              <Text style={styles.comparisonLockedText}>Consejos personalizados ilimitados</Text>
            </View>
            <Animated.Text style={[styles.premiumBadge, { opacity: premiumGlow }]}>Premium</Animated.Text>
          </View>
          <View style={[styles.comparisonRow, styles.premiumLockedRow]}>
            <View style={styles.premiumLockedLeft}>
              <Lock size={14} color={THEME.colors.text.secondary} />
              <Text style={styles.comparisonLockedText}>Priorización emocional avanzada</Text>
            </View>
            <Animated.Text style={[styles.premiumBadge, { opacity: premiumGlow }]}>Premium</Animated.Text>
          </View>
        </View>

        {primaryPackage ? (
          <View style={styles.priceHighlightCard}>
            <Text style={styles.priceHighlightLabel}>Precio actual</Text>
            <Text style={styles.priceHighlightValue}>
              {primaryPackage.product.priceString}
              <Text style={styles.priceHighlightPeriod}>{getPeriodLabel(primaryPackage)}</Text>
            </Text>
            <Text style={styles.priceHighlightHint}>Suscripción que puedes cancelar cuando quieras.</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => void handlePurchase(primaryPackage)}
              disabled={isPurchasing || isRestoring || isRefreshing || subscriptionLoading}
              style={styles.ctaWrap}
              accessibilityRole="button"
              accessibilityLabel={`Elegir plan ${primaryPackage.product.title}`}
              accessibilityHint="Inicia la compra del plan premium"
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
                  <Text style={styles.ctaText}>Continuar con Premium</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : null}

        {subscriptionLoading && packages.length === 0 ? (
          <View style={styles.loadingPlans}>
            <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
            <Text style={styles.loadingPlansText}>Cargando planes…</Text>
          </View>
        ) : packages.length > 0 ? (
          packages.map((pkg) => (
            <View key={pkg.identifier} style={styles.planCard}>
              <Text style={styles.planTitle}>{pkg.product.title}</Text>
              <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
              <Text style={styles.planDescription}>{pkg.product.description || 'Suscripción premium de Koraa.'}</Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => void handlePurchase(pkg)}
                disabled={isPurchasing || isRestoring || isRefreshing || subscriptionLoading}
                style={styles.ctaWrap}
                accessibilityRole="button"
                accessibilityLabel={`Elegir plan ${pkg.product.title}`}
                accessibilityHint="Inicia la compra de este plan premium"
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
                    <Text style={styles.ctaText}>Elegir este plan</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Estamos cargando tus planes Premium</Text>
            <Text style={styles.emptyText}>
              Si aún no ves precios, toca reintentar. Tu suscripción se gestiona de forma segura con App Store.
            </Text>
            <Text style={styles.fallbackPlansTitle}>Mientras tanto, puedes revisar tus planes:</Text>
            <View style={styles.fallbackPlansWrap}>
              <View style={styles.planCard}>
                <View style={styles.fallbackPlanHeader}>
                  <Text style={styles.planTitle}>Plan mensual</Text>
                  <View style={styles.fallbackPlanBadge}>
                    <Text style={styles.fallbackPlanBadgeText}>Flexible</Text>
                  </View>
                </View>
                <Text style={styles.planPrice}>{FALLBACK_MONTHLY_PRICE}</Text>
                <Text style={styles.planDescription}>Ideal para empezar sin compromiso anual.</Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleFallbackPlanPress('monthly')}
                  style={styles.ctaWrap}
                  accessibilityRole="button"
                  accessibilityLabel="Comprar plan mensual"
                  accessibilityHint="Muestra información temporal del plan mensual"
                >
                  <LinearGradient
                    colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cta}
                  >
                    <Text style={styles.ctaText}>Comprar mensual</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <LinearGradient
                colors={['rgba(74, 144, 226, 0.07)', 'rgba(255, 107, 107, 0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fallbackAnnualCard}
              >
                <Text style={styles.planTitle}>Plan anual</Text>
                <Text style={styles.planPrice}>{FALLBACK_ANNUAL_PRICE}</Text>
                <Text style={styles.planDescription}>{FALLBACK_ANNUAL_BADGE}</Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleFallbackPlanPress('annual')}
                  style={styles.ctaWrap}
                  accessibilityRole="button"
                  accessibilityLabel="Comprar plan anual"
                  accessibilityHint="Muestra información temporal del plan anual"
                >
                  <LinearGradient
                    colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cta}
                  >
                    <Text style={styles.ctaText}>Comprar anual</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
            {isExpoGo ? (
              <Text style={styles.emptyHintExpoGo}>
                Estás en Expo Go: las compras in-app suelen no cargar aquí. Para ver planes y precios reales, usa un
                development build (expo-dev-client) o un build de TestFlight / App Store.
              </Text>
            ) : null}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleContinueFree}
              disabled={isPurchasing || isRestoring || isRefreshing || subscriptionLoading}
              style={styles.emptyPrimaryWrap}
              accessibilityRole="button"
              accessibilityLabel="Continuar con versión gratis"
              accessibilityHint="Cierra premium y sigue usando el plan gratuito"
              accessibilityState={{ disabled: isPurchasing || isRestoring || isRefreshing || subscriptionLoading }}
            >
              <LinearGradient
                colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyPrimaryBtn}
              >
                <Text style={styles.emptyPrimaryBtnText}>Seguir con versión gratis</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.75}
              disabled={isRefreshing}
              onPress={() => void handleRefresh()}
              accessibilityRole="button"
              accessibilityLabel="Actualizar planes premium"
              accessibilityHint="Intenta cargar los planes de premium de nuevo"
              accessibilityState={{ disabled: isRefreshing }}
            >
              <Text style={styles.secondaryButtonText}>{isRefreshing ? 'Actualizando...' : 'Actualizar planes'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.75}
            onPress={() => void handleRestore()}
            disabled={isPurchasing || isRestoring || isRefreshing || subscriptionLoading}
            accessibilityRole="button"
            accessibilityLabel="Restaurar compras"
            accessibilityHint="Busca compras anteriores de esta cuenta"
            accessibilityState={{ disabled: isPurchasing || isRestoring || isRefreshing || subscriptionLoading }}
          >
            <Text style={styles.secondaryButtonText}>{isRestoring ? 'Restaurando...' : 'Restaurar compras'}</Text>
          </TouchableOpacity>
          <View style={styles.legalActionsRow}>
            <TouchableOpacity
              style={styles.legalLinkButton}
              activeOpacity={0.75}
              onPress={() => void openLegalUrl('terms')}
              accessibilityRole="button"
              accessibilityLabel="Ver términos y condiciones"
              accessibilityHint="Abre la página de términos de servicio"
            >
              <Text style={styles.legalLinkText}>Términos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.legalLinkButton}
              activeOpacity={0.75}
              onPress={() => void openLegalUrl('privacy')}
              accessibilityRole="button"
              accessibilityLabel="Ver política de privacidad"
              accessibilityHint="Abre la página de privacidad"
            >
              <Text style={styles.legalLinkText}>Privacidad</Text>
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
  emptyPrimaryWrap: {
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
    marginTop: THEME.spacing.xs,
  },
  emptyPrimaryBtn: {
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  emptyPrimaryBtnText: {
    ...THEME.typography.caption,
    color: THEME.colors.onGradient,
    fontFamily: THEME.fonts.heading.bold,
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
    marginTop: THEME.spacing.sm,
    gap: THEME.spacing.sm,
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
  legalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
  },
  legalLinkButton: {
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.sm,
  },
  legalLinkText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textDecorationLine: 'underline',
    fontFamily: THEME.fonts.heading.medium,
  },
});
