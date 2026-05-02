import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { Home, Edit3, Heart, User, Calendar, Lightbulb } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getPostAuthRoute } from '@/lib/onboardingGate';
import { hasSeenFirstSessionTour } from '@/lib/firstSessionTour';
import { FirstSessionTourModal } from '@/components/onboarding/FirstSessionTourModal';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();
  const userId = user?.id;
  const [allowed, setAllowed] = useState(false);
  const [showFirstSessionTour, setShowFirstSessionTour] = useState(false);

  useEffect(() => {
    setAllowed(false);
  }, [userId]);

  useEffect(() => {
    if (loading) return;
    if (!userId) {
      router.replace('/auth/login');
      return;
    }
    let cancelled = false;
    void (async () => {
      const next = await getPostAuthRoute(userId);
      if (cancelled) return;
      if (next === '/onboarding/welcome') {
        router.replace('/onboarding/welcome');
        return;
      }
      setAllowed(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, loading]);

  useEffect(() => {
    if (!allowed || !userId) {
      setShowFirstSessionTour(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const seen = await hasSeenFirstSessionTour(userId);
      if (!cancelled && !seen) {
        setShowFirstSessionTour(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allowed, userId]);

  if (loading || !userId) {
    return (
      <View style={styles.authGate}>
        <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={styles.authGate}>
        <ActivityIndicator size="large" color={THEME.colors.gradient.blue} />
      </View>
    );
  }

  return (
    <>
      <FirstSessionTourModal
        visible={showFirstSessionTour}
        userId={userId}
        onFinished={() => setShowFirstSessionTour(false)}
      />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: THEME.colors.gradient.blue,
          tabBarInactiveTintColor: THEME.colors.text.secondary,
          tabBarStyle: {
            backgroundColor: THEME.colors.fill[100],
            borderTopWidth: 1,
            borderTopColor: THEME.colors.stroke[100],
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom + 6,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: THEME.fonts.heading.medium,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Hoy',
            tabBarIcon: ({ size, color }) => (
              <Home size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="vaciar"
          options={{
            title: 'Tareas',
            tabBarIcon: ({ size, color }) => (
              <Edit3 size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sentir"
          options={{
            title: 'Sentir',
            tabBarIcon: ({ size, color }) => (
              <Heart size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="semana"
          options={{
            title: 'Semana',
            tabBarIcon: ({ size, color }) => (
              <Calendar size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tips"
          options={{
            title: 'Consejos',
            tabBarIcon: ({ size, color }) => (
              <Lightbulb size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="yo"
          options={{
            title: 'Yo',
            tabBarIcon: ({ size, color }) => (
              <User size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  authGate: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.fill[100],
  },
});
