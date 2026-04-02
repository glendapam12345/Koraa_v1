import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { THEME } from '@/constants/theme';
import { logger } from '@/lib/logger';
import { getPostAuthRoute } from '@/lib/onboardingGate';

export default function IndexScreen() {
  const { user, loading } = useAuth();
  const userId = user?.id;
  const navigatedRef = useRef(false);

  useEffect(() => {
    navigatedRef.current = false;
  }, [userId]);

  useEffect(() => {
    if (loading) return;

    const run = async () => {
      if (navigatedRef.current) return;

      if (!userId) {
        navigatedRef.current = true;
        router.replace('/auth');
        return;
      }

      try {
        const next = await getPostAuthRoute(userId);
        navigatedRef.current = true;
        router.replace(next);
      } catch (e) {
        logger.debug('Index routing:', e);
        navigatedRef.current = true;
        router.replace('/(tabs)');
      }
    };

    const t = setTimeout(() => {
      void run();
    }, 50);

    return () => clearTimeout(t);
  }, [userId, loading]);

  // Timeout de seguridad: si loading tarda más de 10 segundos, redirigir
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        logger.error('Timeout en carga de autenticación, redirigiendo a auth');
        router.replace('/auth');
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [loading]);

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
