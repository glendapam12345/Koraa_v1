import { useEffect, useState, useCallback } from 'react';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { Home, Edit3, Heart, User, Calendar, Lightbulb } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { resolvePostAuthGate } from '@/lib/onboardingGate';
import { AppLoadingGate } from '@/components/AppLoadingGate';
import { hasSeenFirstSessionTour } from '@/lib/firstSessionTour';
import { FirstSessionTourModal } from '@/components/onboarding/FirstSessionTourModal';
import { useI18n } from '@/contexts/I18nContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const userId = user?.id;
  const [allowed, setAllowed] = useState(false);
  const [profileGateError, setProfileGateError] = useState(false);
  const [showFirstSessionTour, setShowFirstSessionTour] = useState(false);

  useEffect(() => {
    setAllowed(false);
    setProfileGateError(false);
  }, [userId]);

  const verifyAccess = useCallback(async () => {
    if (!userId) {
      router.replace('/auth/login');
      return;
    }
    setProfileGateError(false);
    const result = await resolvePostAuthGate(userId);
    if (result.status === 'error') {
      setProfileGateError(true);
      setAllowed(false);
      return;
    }
    if (result.route === '/onboarding/welcome') {
      router.replace('/onboarding/welcome');
      return;
    }
    setAllowed(true);
  }, [userId]);

  useEffect(() => {
    if (loading) return;
    if (!userId) {
      router.replace('/auth/login');
      return;
    }
    void verifyAccess();
  }, [userId, loading, verifyAccess]);

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
    return <AppLoadingGate message={t('boot.loadingProfile')} />;
  }

  if (profileGateError) {
    return (
      <AppLoadingGate
        message={t('boot.loadingProfile')}
        errorMessage={t('boot.profileError')}
        retryLabel={t('boot.retry')}
        onRetry={() => void verifyAccess()}
      />
    );
  }

  if (!allowed) {
    return <AppLoadingGate message={t('boot.loadingProfile')} />;
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
            fontSize: 13,
            fontFamily: THEME.fonts.heading.medium,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.today'),
            tabBarIcon: ({ size, color }) => (
              <Home size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="vaciar"
          options={{
            title: t('tabs.tasks'),
            tabBarIcon: ({ size, color }) => (
              <Edit3 size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sentir"
          options={{
            title: t('tabs.feel'),
            tabBarIcon: ({ size, color }) => (
              <Heart size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="semana"
          options={{
            title: t('tabs.week'),
            tabBarIcon: ({ size, color }) => (
              <Calendar size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tips"
          options={{
            title: t('tabs.tips'),
            tabBarIcon: ({ size, color }) => (
              <Lightbulb size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="yo"
          options={{
            title: t('tabs.profile'),
            tabBarIcon: ({ size, color }) => (
              <User size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

