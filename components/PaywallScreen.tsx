import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Crown, Lock, X } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useSubscription } from '@/contexts/SubscriptionContext';

type PaywallScreenProps = {
  onClose?: () => void;
  onPurchaseCompleted?: () => void;
  onSkip?: () => void;
};

export function PaywallScreen({ onClose, onPurchaseCompleted, onSkip }: PaywallScreenProps) {
  const { currentOffering, checkSubscription, restorePurchases } = useSubscription();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const premiumGlow = useRef(new Animated.Value(0.75)).current;

  const packages = useMemo(() => currentOffering?.availablePackages ?? [], [currentOffering?.availablePackages]);

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
      onPurchaseCompleted?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo completar la compra.';
      Alert.alert('Compra no completada', message);
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
        Alert.alert('Compras restauradas', 'Tu suscripción premium ya está activa.');
        onPurchaseCompleted?.();
      } else {
        Alert.alert('Sin compras para restaurar', result.error ?? 'No encontramos compras anteriores.');
      }
    } finally {
      setIsRestoring(false);
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
            <Text style={styles.benefitText}>Flujo premium de enfoque y priorización emocional.</Text>
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

        {packages.length > 0 ? (
          packages.map((pkg) => (
            <View key={pkg.identifier} style={styles.planCard}>
              <Text style={styles.planTitle}>{pkg.product.title}</Text>
              <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
              <Text style={styles.planDescription}>{pkg.product.description || 'Suscripción premium de Koraa.'}</Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => void handlePurchase(pkg)}
                disabled={isPurchasing || isRestoring || isRefreshing}
                style={styles.ctaWrap}
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
                    <Text style={styles.ctaText}>Probar Premium</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Los planes no cargaron</Text>
            <Text style={styles.emptyText}>
              No pasa nada: puedes seguir usando Koraa gratis con todo lo esencial. Si más tarde quieres Premium,
              podrás ver precios cuando la tienda esté lista (por ejemplo en TestFlight o App Store).
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleContinueFree}
              disabled={isPurchasing || isRestoring || isRefreshing}
              style={styles.emptyPrimaryWrap}
            >
              <LinearGradient
                colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyPrimaryBtn}
              >
                <Text style={styles.emptyPrimaryBtnText}>Continuar con versión gratis</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.75}
              disabled={isRefreshing}
              onPress={() => void handleRefresh()}
            >
              <Text style={styles.secondaryButtonText}>{isRefreshing ? 'Actualizando...' : 'Reintentar cargar planes'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.75}
            onPress={() => void handleRestore()}
            disabled={isPurchasing || isRestoring || isRefreshing}
          >
            <Text style={styles.secondaryButtonText}>{isRestoring ? 'Restaurando...' : 'Restaurar compras'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostButton}
            activeOpacity={0.75}
            onPress={() => {
              if (onClose) {
                onClose();
                return;
              }
              onSkip?.();
            }}
          >
            <Text style={styles.ghostButtonText}>Ahora no</Text>
          </TouchableOpacity>
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
    width: 30,
    height: 30,
    borderRadius: 15,
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
  emptyState: {
    borderRadius: THEME.borderRadius.rounded,
    borderWidth: 1,
    borderColor: THEME.colors.fill[200],
    backgroundColor: THEME.colors.fill[100],
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
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
  ghostButton: {
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostButtonText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.medium,
  },
});
