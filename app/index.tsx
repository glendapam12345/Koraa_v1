import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { THEME } from '@/constants/theme';
import { logger } from '@/lib/logger';

export default function IndexScreen() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Pequeño delay para asegurar que la navegación funcione correctamente
      const timer = setTimeout(() => {
        if (user) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding/welcome');
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  // Timeout de seguridad: si loading tarda más de 10 segundos, redirigir
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        logger.error('Timeout en carga de autenticación, redirigiendo a welcome');
        router.replace('/onboarding/welcome');
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
