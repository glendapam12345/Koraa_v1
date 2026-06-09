import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { AppLoadingGate } from '@/components/AppLoadingGate';
import { useI18n } from '@/contexts/I18nContext';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (loading || !user) return;
    router.replace('/');
  }, [user, loading]);

  if (loading || user) {
    return <AppLoadingGate message={t('boot.loadingProfile')} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: THEME.colors.fill[100] },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
