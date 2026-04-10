import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, View, StyleSheet, Platform } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import { supabase } from '@/lib/supabase';
import {
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  LibreBaskerville_400Regular_Italic,
} from '@expo-google-fonts/libre-baskerville';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { logger } from '@/lib/logger';
import { useNotifications, scheduleDailyReminder } from '@/hooks/useNotifications';
import { AnalyticsScreenTracker } from '@/components/AnalyticsScreenTracker';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'DMSans-Medium': DMSans_500Medium,
    'DMSans-Bold': DMSans_700Bold,
    'LibreBaskerville-Italic': LibreBaskerville_400Regular_Italic,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors
      });
    }
  }, [fontsLoaded, fontError]);

  // Programar notificaciones diarias cuando la app carga
  useEffect(() => {
    if (!fontsLoaded) return;

    // Pequeño delay para asegurar que el usuario esté autenticado
    const timer = setTimeout(() => {
      scheduleDailyReminder().catch(err => {
        logger.debug('Error programando notificaciones (no crítico):', err);
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  useFrameworkReady();
  useNotifications();

  const router = useRouter();
  useEffect(() => {
    const applySessionFromUrl = async (url: string | null) => {
      if (!url) return;
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) return;
      const params = new URLSearchParams(url.slice(hashIndex + 1));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (!access_token || !refresh_token) return;

      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) {
        logger.error('No se pudo aplicar sesión desde el enlace del correo:', error.message);
        return;
      }

      // Evitar reprocesar el hash al recargar (web)
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      }

      // Recuperación de contraseña vs confirmación de email (ambos llevan tokens en #)
      if (url.includes('reset-password')) {
        router.replace('/reset-password');
      } else {
        router.replace('/(tabs)');
      }
    };

    // Web: el enlace de Supabase suele abrir el navegador en la raíz con #access_token=...
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      void applySessionFromUrl(window.location.href);
    }

    void Linking.getInitialURL().then(applySessionFromUrl);
    const sub = Linking.addEventListener('url', ({ url }) => void applySessionFromUrl(url));
    return () => sub.remove();
  }, [router]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <SafeAreaProvider>
          <AnalyticsScreenTracker />
          <View style={styles.root}>
            <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="reset-password" />
            <Stack.Screen name="help" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="project/[id]" />
            <Stack.Screen name="proyectos" />
            <Stack.Screen name="+not-found" />
          </Stack>
            <StatusBar style="auto" />
          </View>
        </SafeAreaProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    ...(Platform.OS === 'web' && { maxWidth: '100%', alignSelf: 'stretch' as const }),
  },
});
