import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { hasCompletedOnboarding, TABS_ROUTE } from '@/lib/onboardingGate';

export default function OnboardingLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user?.id) return;

    let cancelled = false;
    void (async () => {
      const completed = await hasCompletedOnboarding(user.id);
      if (cancelled || completed !== true) return;
      router.replace(TABS_ROUTE);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="name" />
      <Stack.Screen name="how-it-works" />
      <Stack.Screen name="areas" />
      <Stack.Screen name="activities" />
      <Stack.Screen name="capture" />
      <Stack.Screen name="emotion" />
      <Stack.Screen name="energy" />
      <Stack.Screen name="time" />
      <Stack.Screen name="focus" />
      <Stack.Screen name="intro2" />
      <Stack.Screen name="intro3" />
      <Stack.Screen name="projects" />
    </Stack>
  );
}
