import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { THEME } from '@/constants/theme';
import { logger } from '@/lib/logger';
import { getPostAuthRoute, WELCOME_ROUTE } from '@/lib/onboardingGate';

export default function IndexScreen() {
  const { user, loading } = useAuth();
  const userId = user?.id;
  const navigatedRef = useRef(false);

  useEffect(() => {
    navigatedRef.current = false;
  }, [userId]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    const run = async () => {
      if (navigatedRef.current || cancelled) return;

      if (!userId) {
        navigatedRef.current = true;
        if (!cancelled) router.replace('/auth/login');
        return;
      }

      try {
        const next = await getPostAuthRoute(userId);
        if (cancelled) return;
        navigatedRef.current = true;
        router.replace(next);
      } catch (e) {
        if (cancelled) return;
        logger.debug('Index routing:', e);
        navigatedRef.current = true;
        // Fail-closed: no mandar a tabs si hubo error inesperado (evita saltar onboarding)
        router.replace(WELCOME_ROUTE);
      }
    };

    const t = setTimeout(() => {
      void run();
    }, 50);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [userId, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[100],
  },
});
