import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import type { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { ENTITLEMENT_ID } from '@/config/revenuecat';
import { initializeRevenueCat } from '@/lib/revenuecat';
import { logger } from '@/lib/logger';

type SubscriptionContextType = {
  isLoading: boolean;
  isSubscribed: boolean;
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  checkSubscription: () => Promise<boolean>;
  restorePurchases: () => Promise<{ success: boolean; error: string | null }>;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);

  const isSubscribed = useMemo(() => {
    return !!customerInfo?.entitlements.active?.[ENTITLEMENT_ID];
  }, [customerInfo]);

  const checkSubscription = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return false;
    try {
      const Purchases = (await import('react-native-purchases')).default;
      const [info, offerings] = await Promise.all([Purchases.getCustomerInfo(), Purchases.getOfferings()]);
      setCustomerInfo(info);
      setCurrentOffering(offerings.current ?? null);
      return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (error) {
      logger.warn('No se pudo refrescar estado de suscripción:', error);
      setCustomerInfo(null);
      setCurrentOffering(null);
      return false;
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return { success: false, error: t('subscription.unavailablePlatform') };
    }
    try {
      const Purchases = (await import('react-native-purchases')).default;
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return { success: info.entitlements.active[ENTITLEMENT_ID] !== undefined, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : t('subscription.restoreFailed');
      setCustomerInfo(null);
      return { success: false, error: message };
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    const syncRevenueCatUser = async () => {
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        if (!cancelled) setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        await initializeRevenueCat();
        const Purchases = (await import('react-native-purchases')).default;
        if (user?.id) {
          await Purchases.logIn(user.id);
        } else {
          await Purchases.logOut();
        }
        await checkSubscription();
      } catch (error) {
        logger.warn('No se pudo sincronizar RevenueCat con la sesión actual:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void syncRevenueCatUser();
    return () => {
      cancelled = true;
    };
  }, [user?.id, checkSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{
        isLoading,
        isSubscribed,
        customerInfo,
        currentOffering,
        checkSubscription,
        restorePurchases,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription debe usarse dentro de SubscriptionProvider');
  }
  return ctx;
}
