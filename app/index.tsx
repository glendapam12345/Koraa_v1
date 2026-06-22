import { useEffect, useRef, useState, useCallback } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { logger } from '@/lib/logger';
import { resolvePostAuthGate } from '@/lib/onboardingGate';
import { TimeoutError, withTimeout } from '@/lib/withTimeout';
import { AppLoadingGate } from '@/components/AppLoadingGate';

export default function IndexScreen() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const userId = user?.id;
  const navigatedRef = useRef(false);
  const [profileGateError, setProfileGateError] = useState(false);

  useEffect(() => {
    navigatedRef.current = false;
    setProfileGateError(false);
  }, [userId]);

  const runRouting = useCallback(async () => {
    if (navigatedRef.current) return;

    if (!userId) {
      navigatedRef.current = true;
      router.replace('/auth/login');
      return;
    }

    setProfileGateError(false);
    try {
      const result = await withTimeout(resolvePostAuthGate(userId), 15_000);
      if (navigatedRef.current) return;

      if (result.status === 'error') {
        setProfileGateError(true);
        return;
      }

      navigatedRef.current = true;
      router.replace(result.route);
    } catch (e) {
      if (navigatedRef.current) return;
      if (e instanceof TimeoutError) {
        logger.warn('Index routing: profile gate timeout');
      } else {
        logger.debug('Index routing:', e);
      }
      setProfileGateError(true);
    }
  }, [userId]);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      void runRouting();
    }, 50);
    return () => clearTimeout(timer);
  }, [loading, runRouting]);

  if (loading) {
    return <AppLoadingGate message={t('boot.loadingDay')} />;
  }

  if (!userId) {
    return <AppLoadingGate message={t('boot.loadingDay')} />;
  }

  if (profileGateError) {
    return (
      <AppLoadingGate
        message={t('boot.loadingProfile')}
        errorMessage={t('boot.profileError')}
        retryLabel={t('boot.retry')}
        onRetry={() => {
          navigatedRef.current = false;
          void runRouting();
        }}
      />
    );
  }

  return <AppLoadingGate message={t('boot.loadingDay')} />;
}
