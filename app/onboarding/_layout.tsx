import { useEffect } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { hasCompletedOnboarding } from '@/lib/onboardingGate';
import { replaceToHoyTab } from '@/lib/tabNavigation';

export default function OnboardingLayout() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || !user?.id) return;
    if (pathname?.includes('reminders')) return;

    let cancelled = false;
    void (async () => {
      const completed = await hasCompletedOnboarding(user.id);
      if (cancelled || completed !== true) return;
      replaceToHoyTab();
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, loading, pathname]);

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
      <Stack.Screen name="reminders" />
      <Stack.Screen name="time" />
      <Stack.Screen name="focus" />
      <Stack.Screen name="intro2" />
      <Stack.Screen name="intro3" />
      <Stack.Screen name="projects" />
    </Stack>
  );
}
