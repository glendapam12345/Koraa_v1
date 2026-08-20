import { useEffect, useRef, type ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { replaceToHoyTab } from '@/lib/tabNavigation';
import { THEME } from '@/constants/theme';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { openPaywall } from '@/lib/paywallNavigation';

type EmergencyKitPremiumGateProps = {
  children: ReactNode;
};

/** Bloquea rutas /emergency-kit/* sin Premium y redirige al paywall. */
export function EmergencyKitPremiumGate({ children }: EmergencyKitPremiumGateProps) {
  const { isSubscribed, isLoading } = useSubscription();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (isLoading || isSubscribed || redirectedRef.current) return;
    redirectedRef.current = true;
    openPaywall(router, '/emergency-kit');
    if (router.canGoBack()) {
      router.back();
    } else {
      replaceToHoyTab();
    }
  }, [isLoading, isSubscribed]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={THEME.colors.calm.lavenderDeep} />
      </View>
    );
  }

  if (!isSubscribed) {
    return null;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.calm.background,
  },
});
