import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, Linking, View, StyleSheet, Platform } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import { supabase } from '@/lib/supabase';
import { replaceToHoyTab } from '@/lib/tabNavigation';
import {
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  LibreBaskerville_400Regular_Italic,
} from '@expo-google-fonts/libre-baskerville';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { logger } from '@/lib/logger';
import { useNotifications, scheduleActiveReminders } from '@/hooks/useNotifications';
import { AnalyticsScreenTracker } from '@/components/AnalyticsScreenTracker';
import { RecheckCheckInProvider } from '@/contexts/RecheckCheckInContext';
import { initializeRevenueCat } from '@/lib/revenuecat';
import { EllieBootSplash } from '@/components/branding/EllieBootSplash';
import { TabScreenErrorBoundary } from '@/components/TabScreenErrorBoundary';
import { preloadEllieMoodAssets } from '@/lib/ellieMoodAssets';

SplashScreen.preventAutoHideAsync().catch(() => {});

if (__DEV__) {
  LogBox.ignoreLogs([
    'Reduced motion setting is enabled',
    'expo-notifications',
    'Expo Go app detected. Using RevenueCat',
    '[Reanimated] Reduced motion',
  ]);
}

export default function RootLayout() {
  const processedUrlRef = useRef<string | null>(null);
  const isApplyingSessionRef = useRef(false);
  const [showBootSplash, setShowBootSplash] = useState(true);
  const [fontsLoaded, fontError] = useFonts({
    'DMSans-Medium': DMSans_500Medium,
    'DMSans-Bold': DMSans_700Bold,
    'LibreBaskerville-Italic': LibreBaskerville_400Regular_Italic,
  });

  useEffect(() => {
    if (!(fontsLoaded || fontError)) return;
    void preloadEllieMoodAssets();
    // Misma pantalla rosa: ocultar nativo al instante; boot solo un instante con blink.
    void SplashScreen.hideAsync().catch(() => {});
    const t = setTimeout(() => setShowBootSplash(false), 900);
    return () => clearTimeout(t);
  }, [fontsLoaded, fontError]);

  // Programar notificaciones diarias cuando la app carga
  useEffect(() => {
    if (!fontsLoaded) return;

    // Pequeño delay para asegurar que el usuario esté autenticado
    const timer = setTimeout(() => {
      scheduleActiveReminders().catch(err => {
        logger.debug('Error programando notificaciones (no crítico):', err);
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  useFrameworkReady();
  useNotifications();

  useEffect(() => {
    if (!fontsLoaded) return;
    void initializeRevenueCat();
  }, [fontsLoaded]);

  const router = useRouter();
  useEffect(() => {
    const applySessionFromUrl = async (url: string | null) => {
      if (!url) return;
      if (processedUrlRef.current === url || isApplyingSessionRef.current) return;
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) return;
      const params = new URLSearchParams(url.slice(hashIndex + 1));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      const authType = params.get('type');
      if (!access_token || !refresh_token) return;

      isApplyingSessionRef.current = true;
      try {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) {
          logger.error('No se pudo aplicar sesión desde el enlace del correo:', error.message);
          return;
        }
        processedUrlRef.current = url;

        // Evitar reprocesar el hash al recargar (web)
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        }

        // Recuperación de contraseña vs confirmación de email (ambos llevan tokens en #)
        const isRecoveryLink = url.includes('reset-password') || authType === 'recovery';
        if (isRecoveryLink) {
          router.replace('/reset-password');
        } else {
          replaceToHoyTab();
        }
      } finally {
        isApplyingSessionRef.current = false;
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
    return (
      <View style={styles.root}>
        <EllieBootSplash />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <I18nProvider>
      <AuthProvider>
        <RecheckCheckInProvider>
        <SubscriptionProvider>
          <SafeAreaProvider>
            <AnalyticsScreenTracker />
            <View style={styles.root}>
              <TabScreenErrorBoundary screenName="root">
              <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="reset-password" />
              <Stack.Screen name="help" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="sentir"
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="streak"
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen name="paywall" />
              <Stack.Screen name="project/[id]" />
              <Stack.Screen name="proyectos" />
              <Stack.Screen name="tips" />
              <Stack.Screen name="focus-session" />
              <Stack.Screen
                name="emergency-kit"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
              </TabScreenErrorBoundary>
              <StatusBar style="auto" />
              <EllieBootSplash visible={showBootSplash} />
            </View>
          </SafeAreaProvider>
        </SubscriptionProvider>
        </RecheckCheckInProvider>
      </AuthProvider>
      </I18nProvider>
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
